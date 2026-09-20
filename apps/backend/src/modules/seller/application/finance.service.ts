import { prisma, OrderStatus, PayoutStatus, TransactionType } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';

export class FinanceService {

  static async getSummary(storeId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);

    const [
      deliveredOrders,
      todayOrders,
      yesterdayOrders,
      completedPayouts,
      pendingPayoutsList
    ] = await Promise.all([
      // Total gross revenue from fulfilled orders
      prisma.order.findMany({
        where: { storeId, status: OrderStatus.DELIVERED },
        select: { totalAmount: true }
      }),
      // Today's collected orders
      prisma.order.findMany({
        where: {
          storeId,
          createdAt: { gte: todayStart },
          status: { not: OrderStatus.CANCELLED }
        },
        select: { totalAmount: true }
      }),
      // Yesterday's collected orders
      prisma.order.findMany({
        where: {
          storeId,
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          status: { not: OrderStatus.CANCELLED }
        },
        select: { totalAmount: true }
      }),
      // Completed payouts
      prisma.sellerPayout.findMany({
        where: { storeId, status: PayoutStatus.COMPLETED },
        select: { amount: true, fee: true }
      }),
      // Pending payouts
      prisma.sellerPayout.findMany({
        where: { storeId, status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] } },
        select: { amount: true }
      })
    ]);

    const totalRevenue = deliveredOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const totalPayouts = completedPayouts.reduce((acc, p) => acc + p.amount + p.fee, 0);
    const pendingPayouts = pendingPayoutsList.reduce((acc, p) => acc + p.amount, 0);
    const availableBalance = Math.max(0, totalRevenue - (totalPayouts + pendingPayouts));

    const todayCollected = todayOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const lastCollected = yesterdayOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    return {
      totalRevenue,
      totalPayouts,
      pendingPayouts,
      availableBalance,
      todayCollected,
      lastCollected,
      todayOrders: todayOrders.length,
      lastOrders: yesterdayOrders.length
    };
  }

  // Bank Accounts Management
  static async getBankAccounts(storeId: string) {
    return await prisma.sellerBankAccount.findMany({
      where: { storeId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }]
    });
  }

  static async addBankAccount(storeId: string, data: { accountName: string; bankName: string; accountNumber: string; ifsc: string }) {
    const { accountName, bankName, accountNumber, ifsc } = data;

    // Validate IFSC format (4 letters, 0, 6 letters/digits)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc.toUpperCase())) {
      throw new AppError('Invalid IFSC code format (e.g. HDFC0001234)', 400);
    }

    if (accountNumber.length < 8 || accountNumber.length > 20) {
      throw new AppError('Account number must be between 8 and 20 digits', 400);
    }

    // Mask account number: show last 4 digits e.g. ****9042
    const masked = '****' + accountNumber.slice(-4);

    // Check if store already has any bank accounts; if not, make this primary
    const count = await prisma.sellerBankAccount.count({ where: { storeId } });
    const isPrimary = count === 0;

    return await prisma.sellerBankAccount.create({
      data: {
        storeId,
        accountName,
        bankName,
        accountNumber: masked,
        fullAccount: accountNumber,
        ifsc: ifsc.toUpperCase(),
        isPrimary,
        isVerified: true
      }
    });
  }

  static async setPrimaryBankAccount(storeId: string, accountId: string) {
    const target = await prisma.sellerBankAccount.findFirst({
      where: { id: accountId, storeId }
    });

    if (!target) throw new AppError('Bank account not found', 404);

    return await prisma.$transaction(async (tx) => {
      await tx.sellerBankAccount.updateMany({
        where: { storeId },
        data: { isPrimary: false }
      });

      return await tx.sellerBankAccount.update({
        where: { id: accountId },
        data: { isPrimary: true }
      });
    }, { maxWait: 15000, timeout: 30000 });
  }

  static async deleteBankAccount(storeId: string, accountId: string) {
    const target = await prisma.sellerBankAccount.findFirst({
      where: { id: accountId, storeId }
    });

    if (!target) throw new AppError('Bank account not found', 404);
    if (target.isPrimary) {
      throw new AppError('Cannot delete primary bank account. Please set another account as primary first.', 400);
    }

    await prisma.sellerBankAccount.delete({ where: { id: accountId } });
    return { success: true };
  }

  // Payouts
  static async getPayouts(storeId: string) {
    const payouts = await prisma.sellerPayout.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      include: {
        bankAccount: {
          select: { bankName: true, accountNumber: true }
        }
      }
    });

    const total = payouts.length;
    const completed = payouts.filter(p => p.status === PayoutStatus.COMPLETED).length;
    const successRate = total === 0 ? '100%' : `${((completed / total) * 100).toFixed(1)}%`;
    const totalPayoutsAmount = payouts
      .filter(p => p.status === PayoutStatus.COMPLETED)
      .reduce((sum, p) => sum + p.amount, 0);

    const formatted = payouts.map(p => ({
      id: p.id,
      date: new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: p.amount,
      status: p.status === PayoutStatus.COMPLETED ? 'Completed' : (p.status === PayoutStatus.FAILED ? 'Failed' : 'Pending'),
      bank: `${p.bankAccount?.bankName || 'Bank'} (${p.bankAccount?.accountNumber || ''})`
    }));

    return {
      totalPayouts: totalPayoutsAmount,
      successRate,
      payouts: formatted
    };
  }

  static async requestPayout(storeId: string, data: { amount: number; bankAccountId?: string }) {
    const { amount, bankAccountId } = data;

    if (amount < 100) {
      throw new AppError('Minimum payout withdrawal amount is 100', 400);
    }

    const summary = await this.getSummary(storeId);
    if (amount > summary.availableBalance) {
      throw new AppError(`Insufficient available balance (Available: ${summary.availableBalance})`, 400);
    }

    let targetBankId = bankAccountId;
    if (!targetBankId) {
      const primaryBank = await prisma.sellerBankAccount.findFirst({
        where: { storeId, isPrimary: true }
      });
      if (!primaryBank) {
        throw new AppError('No bank account linked. Please add a bank account first.', 400);
      }
      targetBankId = primaryBank.id;
    }

    return await prisma.$transaction(async (tx) => {
      const payout = await tx.sellerPayout.create({
        data: {
          storeId,
          bankAccountId: targetBankId!,
          amount,
          fee: 0,
          status: PayoutStatus.COMPLETED, // Auto-mark completed in sandbox/dev
          referenceNumber: `PAY-${Date.now()}`
        }
      });

      // Write to ledger
      await tx.sellerTransaction.create({
        data: {
          storeId,
          title: `Payout to Bank (${payout.referenceNumber})`,
          amount: -amount,
          type: TransactionType.PAYOUT,
          description: `Withdrawal to linked bank account`
        }
      });

      return payout;
    }, { maxWait: 15000, timeout: 30000 });
  }

  // Transactions Ledger
  static async getTransactions(storeId: string, query: { type?: string; page?: number; limit?: number }) {
    const { type = 'All', page = 1, limit = 50 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    let typeFilter: any = undefined;
    if (type === 'Credits') typeFilter = TransactionType.CREDIT;
    else if (type === 'Debits') typeFilter = TransactionType.DEBIT;
    else if (type === 'Payouts') typeFilter = TransactionType.PAYOUT;

    const where = {
      storeId,
      ...(typeFilter ? { type: typeFilter } : {})
    };

    const [total, list] = await Promise.all([
      prisma.sellerTransaction.count({ where }),
      prisma.sellerTransaction.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const formatted = list.map(t => {
      let uiType = 'Credit';
      if (t.type === TransactionType.DEBIT) uiType = 'Refund';
      else if (t.type === TransactionType.PAYOUT) uiType = 'Payout';

      return {
        id: t.id,
        title: t.title,
        date: new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' +
              new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        amount: t.amount,
        type: uiType,
        description: t.description
      };
    });

    return {
      transactions: formatted,
      total,
      page: Number(page),
      limit: Number(limit)
    };
  }
}
