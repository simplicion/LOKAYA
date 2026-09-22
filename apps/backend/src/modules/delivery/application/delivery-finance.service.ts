import { prisma, PayoutStatus } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';

export class DeliveryFinanceService {

  /**
   * Calculates real-time earnings, pending withdrawals, and available withdrawal balance for a delivery partner.
   */
  static async getSummary(userId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
      select: { id: true, totalEarnings: true }
    });

    if (!partner) {
      throw new AppError('Delivery partner profile not found', 404);
    }

    const [completedPayouts, pendingPayoutsList] = await Promise.all([
      prisma.riderPayout.findMany({
        where: { deliveryPartnerId: partner.id, status: PayoutStatus.COMPLETED },
        select: { amount: true, fee: true }
      }),
      prisma.riderPayout.findMany({
        where: { 
          deliveryPartnerId: partner.id, 
          status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] } 
        },
        select: { amount: true }
      })
    ]);

    const totalEarnings = partner.totalEarnings || 0;
    const totalPayouts = completedPayouts.reduce((acc, p) => acc + p.amount + p.fee, 0);
    const pendingPayouts = pendingPayoutsList.reduce((acc, p) => acc + p.amount, 0);
    const availableBalance = Math.max(0, totalEarnings - (totalPayouts + pendingPayouts));

    return {
      totalEarnings,
      totalPayouts,
      pendingPayouts,
      availableBalance
    };
  }

  /**
   * Get all linked bank accounts for a delivery partner.
   */
  static async getBankAccounts(userId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!partner) throw new AppError('Delivery partner profile not found', 404);

    return await prisma.riderBankAccount.findMany({
      where: { deliveryPartnerId: partner.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }]
    });
  }

  /**
   * Add a bank account for delivery partner payouts.
   */
  static async addBankAccount(userId: string, data: { accountName: string; bankName: string; accountNumber: string; ifsc: string }) {
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

    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!partner) throw new AppError('Delivery partner profile not found', 404);

    const cleanAccount = accountNumber.trim().replace(/\s+/g, '');
    const cleanIfsc = (ifsc || 'NA').trim().toUpperCase();
    const masked = cleanAccount.length > 4 
      ? `••••${cleanAccount.slice(-4)}` 
      : cleanAccount;

    const count = await prisma.riderBankAccount.count({
      where: { deliveryPartnerId: partner.id }
    });

    return await prisma.riderBankAccount.create({
      data: {
        deliveryPartnerId: partner.id,
        accountName: accountName.trim(),
        bankName: bankName.trim(),
        accountNumber: masked,
        fullAccount: cleanAccount,
        ifsc: cleanIfsc,
        isPrimary: count === 0,
        isVerified: true
      }
    });
  }

  /**
   * Sets primary bank account for delivery partner payouts.
   */
  static async setPrimaryBankAccount(userId: string, accountId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!partner) throw new AppError('Delivery partner profile not found', 404);

    return await prisma.$transaction(async (tx) => {
      await tx.riderBankAccount.updateMany({
        where: { deliveryPartnerId: partner.id },
        data: { isPrimary: false }
      });

      return await tx.riderBankAccount.update({
        where: { id: accountId },
        data: { isPrimary: true }
      });
    });
  }

  /**
   * Delete a bank account.
   */
  static async deleteBankAccount(userId: string, accountId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!partner) throw new AppError('Delivery partner profile not found', 404);

    const target = await prisma.riderBankAccount.findFirst({
      where: { id: accountId, deliveryPartnerId: partner.id }
    });
    if (!target) throw new AppError('Bank account not found', 404);

    await prisma.riderBankAccount.delete({ where: { id: accountId } });
    return { success: true };
  }

  /**
   * Get all withdrawal requests for a delivery partner.
   */
  static async getPayouts(userId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!partner) throw new AppError('Delivery partner profile not found', 404);

    const payouts = await prisma.riderPayout.findMany({
      where: { deliveryPartnerId: partner.id },
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

  /**
   * Request a payout / withdrawal.
   */
  static async requestPayout(userId: string, data: { amount: number; bankAccountId?: string }) {
    const { amount, bankAccountId } = data;

    if (!amount || amount < 100) {
      throw new AppError('Minimum payout withdrawal amount is 100', 400);
    }

    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
      select: { id: true, totalEarnings: true }
    });
    if (!partner) throw new AppError('Delivery partner profile not found', 404);

    const summary = await this.getSummary(userId);
    if (amount > summary.availableBalance) {
      throw new AppError(`Insufficient available balance (Available: ${summary.availableBalance})`, 400);
    }

    let targetBankId = bankAccountId;
    if (!targetBankId) {
      const primaryBank = await prisma.riderBankAccount.findFirst({
        where: { deliveryPartnerId: partner.id, isPrimary: true }
      });
      if (!primaryBank) {
        throw new AppError('No bank account linked. Please add a bank account first.', 400);
      }
      targetBankId = primaryBank.id;
    }

    return await prisma.riderPayout.create({
      data: {
        deliveryPartnerId: partner.id,
        bankAccountId: targetBankId!,
        amount,
        fee: 0,
        status: PayoutStatus.PENDING,
        referenceNumber: `RIDER-PAY-${Date.now()}`
      },
      include: {
        bankAccount: true
      }
    });
  }

  // ==========================================
  // Admin Rider Payout Management
  // ==========================================

  static async getAdminRiderPayouts(query: { status?: string; page?: number; limit?: number; search?: string }) {
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
        { deliveryPartner: { user: { name: { contains: s, mode: 'insensitive' } } } },
        { deliveryPartner: { user: { phone: { contains: s, mode: 'insensitive' } } } },
        { bankAccount: { accountName: { contains: s, mode: 'insensitive' } } },
        { bankAccount: { bankName: { contains: s, mode: 'insensitive' } } },
        { bankAccount: { fullAccount: { contains: s, mode: 'insensitive' } } }
      ];
    }

    const [payouts, total, pendingAgg, completedAgg] = await Promise.all([
      prisma.riderPayout.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          deliveryPartner: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,
                  avatarUrl: true
                }
              }
            }
          },
          bankAccount: true
        }
      }),
      prisma.riderPayout.count({ where }),
      prisma.riderPayout.aggregate({
        where: { status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] } },
        _count: { id: true },
        _sum: { amount: true }
      }),
      prisma.riderPayout.aggregate({
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

  static async completeRiderPayout(payoutId: string, transactionRef?: string) {
    const payout = await prisma.riderPayout.findUnique({
      where: { id: payoutId },
      include: { deliveryPartner: { include: { user: true } }, bankAccount: true }
    });

    if (!payout) {
      throw new AppError('Rider payout record not found', 404);
    }
    if (payout.status === PayoutStatus.COMPLETED) {
      throw new AppError('Rider payout is already marked as completed', 400);
    }

    const ref = transactionRef?.trim() || payout.referenceNumber || `RIDER-DONE-${Date.now()}`;

    return await prisma.riderPayout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.COMPLETED,
        referenceNumber: ref,
        failureReason: null
      },
      include: { deliveryPartner: { include: { user: true } }, bankAccount: true }
    });
  }

  static async rejectRiderPayout(payoutId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new AppError('Rejection reason is required', 400);
    }

    const payout = await prisma.riderPayout.findUnique({
      where: { id: payoutId }
    });

    if (!payout) {
      throw new AppError('Rider payout record not found', 404);
    }
    if (payout.status === PayoutStatus.COMPLETED) {
      throw new AppError('Cannot reject an already completed payout', 400);
    }

    return await prisma.riderPayout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.FAILED,
        failureReason: reason.trim()
      },
      include: { deliveryPartner: { include: { user: true } }, bankAccount: true }
    });
  }
}
