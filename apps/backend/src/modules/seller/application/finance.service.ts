import { prisma, OrderStatus, PayoutStatus, TransactionType, NotificationType } from '@workspace/db';
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

    if (!accountName || !accountName.trim()) {
      throw new AppError('Account holder name is required', 400);
    }
    if (!bankName || !bankName.trim()) {
      throw new AppError('Bank name is required', 400);
    }
    if (!accountNumber || !accountNumber.trim()) {
      throw new AppError('Account number is required', 400);
    }
    if (!ifsc || !ifsc.trim()) {
      throw new AppError('IFSC code is required', 400);
    }

    const cleanAccount = accountNumber.trim();
    const cleanIfsc = ifsc.trim().toUpperCase();

    // Mask account number: show last 4 digits e.g. ****9042
    const masked = cleanAccount.length > 4 ? '****' + cleanAccount.slice(-4) : cleanAccount;

    // Check if store already has any bank accounts; if not, make this primary
    const count = await prisma.sellerBankAccount.count({ where: { storeId } });
    const isPrimary = count === 0;

    return await prisma.sellerBankAccount.create({
      data: {
        storeId,
        accountName: accountName.trim(),
        bankName: bankName.trim(),
        accountNumber: masked,
        fullAccount: cleanAccount,
        ifsc: cleanIfsc,
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
    const pendingPayoutsAmount = payouts
      .filter(p => p.status === PayoutStatus.PENDING || p.status === PayoutStatus.PROCESSING)
      .reduce((sum, p) => sum + p.amount, 0);

    const formatted = payouts.map(p => ({
      id: p.id,
      date: new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: p.amount,
      status: p.status === PayoutStatus.COMPLETED ? 'Completed' : (p.status === PayoutStatus.FAILED ? 'Failed' : 'Pending'),
      rawStatus: p.status,
      bank: `${p.bankAccount?.bankName || 'Bank'} (${p.bankAccount?.accountNumber || ''})`,
      referenceNumber: p.referenceNumber,
      failureReason: p.failureReason
    }));

    return {
      totalPayouts: totalPayoutsAmount,
      pendingPayouts: pendingPayoutsAmount,
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
          status: PayoutStatus.PENDING,
          referenceNumber: `PAY-${Date.now()}`
        }
      });

      // Write pending transaction to ledger
      await tx.sellerTransaction.create({
        data: {
          storeId,
          title: `Withdrawal Requested (${payout.referenceNumber})`,
          amount: -amount,
          type: TransactionType.PAYOUT,
          description: `Payout request submitted for admin processing`
        }
      });

      return payout;
    }, { maxWait: 15000, timeout: 30000 });
  }

  // Admin Payouts Management
  static async getAdminPayouts(query: { status?: string; page?: number; limit?: number; search?: string }) {
    const { status, page = 1, limit = 50, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status && status !== 'all' && status !== 'ALL') {
      where.status = status as PayoutStatus;
    }
    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { referenceNumber: { contains: s, mode: 'insensitive' } },
        { store: { name: { contains: s, mode: 'insensitive' } } },
        { bankAccount: { accountName: { contains: s, mode: 'insensitive' } } },
        { bankAccount: { bankName: { contains: s, mode: 'insensitive' } } },
        { bankAccount: { fullAccount: { contains: s, mode: 'insensitive' } } }
      ];
    }

    const [payouts, total, pendingAgg, completedAgg] = await Promise.all([
      prisma.sellerPayout.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              contactPhone: true,
              users: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true
                    }
                  }
                }
              }
            }
          },
          bankAccount: true
        }
      }),
      prisma.sellerPayout.count({ where }),
      prisma.sellerPayout.aggregate({
        where: { status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] } },
        _count: { id: true },
        _sum: { amount: true }
      }),
      prisma.sellerPayout.aggregate({
        where: { status: PayoutStatus.COMPLETED },
        _count: { id: true },
        _sum: { amount: true }
      })
    ]);

    return {
      payouts,
      total,
      page: Number(page),
      limit: Number(limit),
      stats: {
        pendingCount: pendingAgg._count.id || 0,
        pendingAmount: pendingAgg._sum.amount || 0,
        completedCount: completedAgg._count.id || 0,
        completedAmount: completedAgg._sum.amount || 0
      }
    };
  }

  static async completePayout(payoutId: string, transactionRef?: string) {
    const payout = await prisma.sellerPayout.findUnique({
      where: { id: payoutId },
      include: { store: true, bankAccount: true }
    });

    if (!payout) {
      throw new AppError('Payout record not found', 404);
    }
    if (payout.status === PayoutStatus.COMPLETED) {
      throw new AppError('Payout is already marked as completed', 400);
    }

    const ref = transactionRef?.trim() || payout.referenceNumber || `PAY-DONE-${Date.now()}`;

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.sellerPayout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.COMPLETED,
          referenceNumber: ref,
          failureReason: null
        },
        include: { store: true, bankAccount: true }
      });

      // Write completed ledger transaction
      await tx.sellerTransaction.create({
        data: {
          storeId: payout.storeId,
          title: `Payout Completed (${ref})`,
          amount: -payout.amount,
          type: TransactionType.PAYOUT,
          description: `Withdrawal of ${payout.amount} transferred to ${payout.bankAccount?.bankName || 'bank'} (${payout.bankAccount?.accountNumber || ''})`
        }
      });

      // Send seller notification
      await tx.sellerNotification.create({
        data: {
          storeId: payout.storeId,
          type: NotificationType.PAYOUT,
          title: 'Payout Processed Successfully',
          message: `Your withdrawal request for रु${payout.amount.toLocaleString()} has been processed and paid out. Reference: ${ref}`
        }
      });

      return updated;
    }, { maxWait: 15000, timeout: 30000 });
  }

  static async rejectPayout(payoutId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new AppError('Rejection reason is required', 400);
    }

    const payout = await prisma.sellerPayout.findUnique({
      where: { id: payoutId }
    });

    if (!payout) {
      throw new AppError('Payout record not found', 404);
    }
    if (payout.status === PayoutStatus.COMPLETED) {
      throw new AppError('Cannot reject an already completed payout', 400);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.sellerPayout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.FAILED,
          failureReason: reason.trim()
        },
        include: { store: true, bankAccount: true }
      });

      // Send alert notification to seller
      await tx.sellerNotification.create({
        data: {
          storeId: payout.storeId,
          type: NotificationType.ALERT,
          title: 'Payout Request Rejected',
          message: `Your withdrawal request for रु${payout.amount.toLocaleString()} was rejected: ${reason.trim()}. The amount is restored in your available balance.`
        }
      });

      return updated;
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
