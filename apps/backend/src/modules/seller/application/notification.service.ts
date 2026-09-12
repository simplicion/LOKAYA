import { prisma } from '@workspace/db';

export class NotificationService {
  static async getNotifications(storeId: string) {
    const [unreadCount, notifications] = await Promise.all([
      prisma.sellerNotification.count({
        where: { storeId, isRead: false }
      }),
      prisma.sellerNotification.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    const formatted = notifications.map(n => {
      const now = Date.now();
      const diffMin = Math.round((now - new Date(n.createdAt).getTime()) / (1000 * 60));
      let time = `${diffMin}m ago`;
      if (diffMin > 60) time = `${Math.round(diffMin / 60)}h ago`;
      if (diffMin > 1440) time = `${Math.round(diffMin / 1440)}d ago`;

      return {
        id: n.id,
        type: n.type.toLowerCase(),
        title: n.title,
        message: n.message,
        time,
        read: n.isRead,
        linkUrl: n.linkUrl
      };
    });

    return {
      unreadCount,
      notifications: formatted
    };
  }

  static async markAsRead(id: string, storeId: string) {
    return await prisma.sellerNotification.updateMany({
      where: { id, storeId },
      data: { isRead: true }
    });
  }

  static async markAllAsRead(storeId: string) {
    return await prisma.sellerNotification.updateMany({
      where: { storeId },
      data: { isRead: true }
    });
  }
}
