import { Router } from 'express';
import { validateRequest } from '../../../shared/middleware/validate';
import { requireAuth, AuthRequest } from '../../../shared/middleware/auth';
import { AppError } from '../../../shared/errors/AppError';
import { SellerService } from '../application/seller.service';
import { DashboardService } from '../application/dashboard.service';
import { FinanceService } from '../application/finance.service';
import { AnalyticsService } from '../application/analytics.service';
import { NotificationService } from '../application/notification.service';
import { onboardSellerSchema, updateStoreProfileSchema } from '../domain/schemas';

export const sellerRouter: Router = Router();
const sellerService = new SellerService();

// Helper to resolve seller's storeId from authenticated request
async function getSellerStoreId(userId: string): Promise<string> {
  const store = await sellerService.getMyStore(userId);
  if (!store) {
    throw new AppError('Store not found for this user', 404);
  }
  return store.id;
}

// ----------------------------------------------------
// Store Onboarding & Management
// ----------------------------------------------------

sellerRouter.post('/onboard', requireAuth, validateRequest(onboardSellerSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const store = await sellerService.onboardStore(userId, req.body);
    res.status(201).json({ store });
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const store = await sellerService.getMyStore(userId);
    res.status(200).json(store);
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/pending', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const stores = await sellerService.getPendingStores();
    res.status(200).json(stores);
  } catch (error) {
    next(error);
  }
});

// Public Explore Stores for Map and Nearby Bottom Sheet
sellerRouter.get('/explore', async (req, res, next) => {
  try {
    const category = req.query.category as string;
    const search = req.query.search as string;
    const stores = await sellerService.getExploreStores({ category, search });
    res.status(200).json(stores);
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/all', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const status = req.query.status as string;
    const stores = await sellerService.getAllStores(status);
    res.status(200).json(stores);
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// Dashboard Endpoints
// ----------------------------------------------------

sellerRouter.get('/dashboard/stats', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const range = (req.query.range as string) || 'Today';
    const stats = await DashboardService.getStats(storeId, range);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/dashboard/recent-orders', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const orders = await DashboardService.getRecentOrders(storeId, limit);
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/dashboard/sales-trend', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const range = (req.query.range as string) || '7d';
    const trend = await DashboardService.getSalesTrend(storeId, range);
    res.status(200).json(trend);
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// Finance Endpoints
// ----------------------------------------------------

sellerRouter.get('/finance/summary', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const summary = await FinanceService.getSummary(storeId);
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/finance/bank-accounts', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const accounts = await FinanceService.getBankAccounts(storeId);
    res.status(200).json(accounts);
  } catch (error) {
    next(error);
  }
});

sellerRouter.post('/finance/bank-accounts', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const account = await FinanceService.addBankAccount(storeId, req.body);
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
});

sellerRouter.patch('/finance/bank-accounts/:id/primary', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const updated = await FinanceService.setPrimaryBankAccount(storeId, req.params.id);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

sellerRouter.delete('/finance/bank-accounts/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const result = await FinanceService.deleteBankAccount(storeId, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/finance/payouts', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const payouts = await FinanceService.getPayouts(storeId);
    res.status(200).json(payouts);
  } catch (error) {
    next(error);
  }
});

sellerRouter.post('/finance/payouts/request', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const payout = await FinanceService.requestPayout(storeId, req.body);
    res.status(201).json(payout);
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/finance/transactions', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const result = await FinanceService.getTransactions(storeId, req.query as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// Notification Endpoints
// ----------------------------------------------------

sellerRouter.get('/notifications', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const result = await NotificationService.getNotifications(storeId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

sellerRouter.patch('/notifications/:id/read', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    await NotificationService.markAsRead(req.params.id, storeId);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

sellerRouter.patch('/notifications/read-all', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    await NotificationService.markAllAsRead(storeId);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// Analytics Endpoints
// ----------------------------------------------------

sellerRouter.get('/analytics/overview', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const range = (req.query.range as string) || 'This Month';
    const data = await AnalyticsService.getOverview(storeId, range);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/analytics/sales-revenue', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const range = (req.query.range as string) || 'This Month';
    const data = await AnalyticsService.getSalesRevenue(storeId, range);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/analytics/products', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const range = (req.query.range as string) || 'This Month';
    const data = await AnalyticsService.getProductAnalytics(storeId, range);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/analytics/orders', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const range = (req.query.range as string) || 'This Month';
    const data = await AnalyticsService.getOrderAnalytics(storeId, range);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/analytics/customers', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const range = (req.query.range as string) || 'This Month';
    const data = await AnalyticsService.getCustomerAnalytics(storeId, range);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

sellerRouter.post('/analytics/export', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const storeId = await getSellerStoreId(req.user!.id);
    const csvData = await AnalyticsService.exportReport(storeId, req.body || {});
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${Date.now()}.csv"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// Parameterized Store Routes (Placed at bottom to prevent shadowing static routes)
// ----------------------------------------------------

sellerRouter.patch('/:storeId/verify', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;
    const store = await sellerService.verifyStore(storeId);
    res.status(200).json({ message: 'Store verified successfully', store });
  } catch (error) {
    next(error);
  }
});

sellerRouter.patch('/:storeId/reject', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { storeId } = req.params;
    const { reason } = req.body || {};
    const store = await sellerService.rejectStore(storeId, reason);
    res.status(200).json({ message: 'Store rejected', store });
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/:storeId/summary', async (req, res, next) => {
  try {
    const summary = await sellerService.getStoreSummary(req.params.storeId);
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
});

sellerRouter.patch('/:storeId/theme', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { storeId } = req.params;
    const store = await sellerService.updateStoreTheme(userId, storeId, req.body);
    res.status(200).json({ message: 'Store theme updated', store });
  } catch (error) {
    next(error);
  }
});

sellerRouter.patch('/:storeId', requireAuth, validateRequest(updateStoreProfileSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { storeId } = req.params;
    const store = await sellerService.updateStoreProfile(userId, storeId, req.body);
    res.status(200).json({ message: 'Store updated', store });
  } catch (error) {
    next(error);
  }
});
