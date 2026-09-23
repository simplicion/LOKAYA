import { prisma, OrderStatus } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';

export class DashboardService {
  /**
   * Aggregate Key Performance Indicators (KPIs) for the Seller Dashboard
   */
  static async getStats(storeId: string, range: string = 'Today') {
    const { startDate, endDate, prevStartDate, prevEndDate } = this.getDateBounds(range);

    const [currentOrders, prevOrders, activeProductsCount, lowStockCount] = await Promise.all([
      prisma.order.findMany({
        where: {
          storeId,
          createdAt: { gte: startDate, lte: endDate },
          status: { not: OrderStatus.CANCELLED }
        },
        select: { totalAmount: true }
      }),
      prisma.order.findMany({
        where: {
          storeId,
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          status: { not: OrderStatus.CANCELLED }
        },
        select: { totalAmount: true }
      }),
      prisma.product.count({
        where: { storeId, isActive: true }
      }),
      prisma.product.count({
        where: {
          storeId,
          isActive: true,
          stockCount: { lte: 10 }
        }
      })
    ]);

    const todayOrders = currentOrders.length;
    const todayRevenue = currentOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const prevOrdersCount = prevOrders.length;
    const prevRevenue = prevOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Calculate growth percentages
    const ordersGrowthPct = prevOrdersCount === 0 
      ? (todayOrders > 0 ? '+100%' : '0%') 
      : `${todayOrders >= prevOrdersCount ? '+' : ''}${(((todayOrders - prevOrdersCount) / prevOrdersCount) * 100).toFixed(1)}%`;

    const revenueGrowthPct = prevRevenue === 0 
      ? (todayRevenue > 0 ? '+100%' : '0%') 
      : `${todayRevenue >= prevRevenue ? '+' : ''}${(((todayRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)}%`;

    return {
      todayOrders,
      todayRevenue,
      activeProducts: activeProductsCount,
      lowStockItems: lowStockCount,
      ordersGrowth: ordersGrowthPct,
      revenueGrowth: revenueGrowthPct
    };
  }

  /**
   * Retrieve recent orders formatted specifically for the Seller Dashboard
   */
  static async getRecentOrders(storeId: string, limit: number = 3, status?: string) {
    const where: any = { storeId };
    if (status && status.toUpperCase() === 'PENDING') {
      where.status = OrderStatus.PENDING;
    } else if (status && status !== 'all') {
      where.status = status as OrderStatus;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        buyer: {
          select: { id: true, name: true, phone: true }
        },
        items: {
          include: {
            product: {
              include: { media: true }
            },
            variant: true
          }
        }
      }
    });

    return orders.map(order => {
      const isToday = new Date(order.createdAt).toDateString() === new Date().toDateString();
      const timeLabel = isToday 
        ? `Today, ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

      let statusColor = 'text-green-600';
      let statusBg = 'bg-green-50';

      if (order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) {
        statusColor = 'text-blue-600';
        statusBg = 'bg-blue-50';
      } else if (order.status === OrderStatus.PROCESSING || order.status === OrderStatus.PACKED) {
        statusColor = 'text-orange-600';
        statusBg = 'bg-orange-50';
      } else if (order.status === OrderStatus.CANCELLED) {
        statusColor = 'text-red-600';
        statusBg = 'bg-red-50';
      }

      const mappedItems = order.items.map(item => {
        const primaryMedia = item.product?.media?.find((m: any) => m.isPrimary)?.url;
        const firstMedia = item.product?.media?.[0]?.url;
        const imgUrl = primaryMedia || firstMedia || item.product?.imageUrl || null;
        return {
          id: item.id,
          name: item.productName || item.product?.name || 'Item',
          qty: item.quantity,
          price: item.priceAt,
          sku: item.sku || item.variant?.sku || '',
          variantName: item.variant?.name || null,
          image: imgUrl
        };
      });

      return {
        id: order.id,
        customerName: order.buyer?.name || 'Customer',
        phone: order.buyer?.phone || '',
        itemsCount: order.items.reduce((acc, item) => acc + item.quantity, 0),
        total: order.totalAmount,
        status: order.status,
        pickupTime: timeLabel,
        statusColor,
        statusBg,
        firstItemImage: mappedItems[0]?.image || null,
        firstItemName: mappedItems[0]?.name || 'Item',
        items: mappedItems
      };
    });
  }

  /**
   * Retrieve time-bucketed sales data for the Dashboard AreaChart
   */
  static async getSalesTrend(storeId: string, range: string = '7d') {
    let days = 7;
    const cleanRange = (range || '7d').toLowerCase().trim();
    if (cleanRange === '14d' || cleanRange === '14') {
      days = 14;
    } else if (cleanRange === '30d' || cleanRange === '30' || cleanRange === 'month') {
      days = 30;
    } else if (cleanRange === '90d' || cleanRange === '90' || cleanRange === 'quarter') {
      days = 90;
    } else if (cleanRange === '1d' || cleanRange === 'today') {
      days = 1;
    }

    const result: Array<{ name: string; date: string; fullDate: string; value: number; ordersCount: number }> = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const dayOrders = await prisma.order.findMany({
        where: {
          storeId,
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: { not: OrderStatus.CANCELLED }
        },
        select: { totalAmount: true }
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const dayName = days <= 7 
        ? startOfDay.toLocaleDateString('en-US', { weekday: 'short' })
        : startOfDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      result.push({ 
        name: dayName, 
        date: startOfDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: startOfDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        value: Math.round(dayRevenue * 100) / 100,
        ordersCount: dayOrders.length
      });
    }

    return result;
  }

  private static getDateBounds(range: string) {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();

    const cleanRange = (range || 'today').toLowerCase().trim();

    if (cleanRange === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
    } else if (cleanRange === 'yesterday') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);

      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
    } else if (cleanRange.includes('week')) {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      prevEndDate = new Date(startDate);
    } else {
      // Month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      prevEndDate = new Date(startDate);
    }

    return { startDate, endDate, prevStartDate, prevEndDate };
  }
}
