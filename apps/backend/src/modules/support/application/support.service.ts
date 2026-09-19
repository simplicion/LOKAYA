import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';

export class SupportService {
  static async createTicket(userId: string, data: {
    subject: string;
    category: string;
    description: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    orderId?: string;
    attachments?: string[];
  }) {
    if (!data.subject || data.subject.trim().length < 3) {
      throw new AppError('Subject must be at least 3 characters', 400);
    }
    if (!data.description || data.description.trim().length < 10) {
      throw new AppError('Description must be at least 10 characters', 400);
    }

    const validCategories = ['ORDER', 'PAYMENT', 'DELIVERY', 'SELLER', 'ACCOUNT', 'OTHER'];
    const category = validCategories.includes(data.category?.toUpperCase())
      ? data.category.toUpperCase()
      : 'OTHER';

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const priority = data.priority && validPriorities.includes(data.priority)
      ? data.priority
      : 'MEDIUM';

    // Generate readable ticket number: TIK-8F3K9-1234
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateHex = Date.now().toString(36).toUpperCase().slice(-5);
    const ticketNumber = `TIK-${dateHex}-${randomSuffix}`;

    const ticket = await (prisma as any).supportTicket.create({
      data: {
        ticketNumber,
        userId,
        subject: data.subject.trim(),
        category,
        priority,
        description: data.description.trim(),
        orderId: data.orderId || null,
        attachments: data.attachments || [],
        status: 'OPEN'
      }
    });

    return ticket;
  }

  static async getUserTickets(userId: string) {
    return await (prisma as any).supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getTicketById(userId: string, ticketId: string, isAdmin = false) {
    const ticket = await (prisma as any).supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true }
        }
      }
    });

    if (!ticket) {
      throw new AppError('Support ticket not found', 404);
    }

    if (!isAdmin && ticket.userId !== userId) {
      throw new AppError('Unauthorized to view this ticket', 403);
    }

    return ticket;
  }

  static async getAllTickets(query?: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }) {
    const where: any = {};

    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query?.priority && query.priority !== 'ALL') {
      where.priority = query.priority;
    }
    if (query?.category && query.category !== 'ALL') {
      where.category = query.category;
    }
    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { ticketNumber: { contains: s, mode: 'insensitive' } },
        { subject: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { user: { name: { contains: s, mode: 'insensitive' } } },
        { user: { email: { contains: s, mode: 'insensitive' } } }
      ];
    }

    const [tickets, totalCount, openCount, inProgressCount, resolvedCount] = await Promise.all([
      (prisma as any).supportTicket.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, avatarUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      (prisma as any).supportTicket.count(),
      (prisma as any).supportTicket.count({ where: { status: 'OPEN' } }),
      (prisma as any).supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      (prisma as any).supportTicket.count({ where: { status: 'RESOLVED' } })
    ]);

    return {
      tickets,
      counts: {
        total: totalCount,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount
      }
    };
  }

  static async updateTicketStatus(ticketId: string, data: {
    status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    adminNotes?: string;
  }) {
    const ticket = await (prisma as any).supportTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new AppError('Support ticket not found', 404);
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;

    const updated = await (prisma as any).supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true }
        }
      }
    });

    return updated;
  }
}
