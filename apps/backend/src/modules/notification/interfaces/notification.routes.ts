import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../../../shared/middleware/auth';
import { FcmService } from '../application/fcm.service';

export const notificationRouter: Router = Router();

// POST /api/v1/notifications/devices - Register or update device FCM token
notificationRouter.post('/devices', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { token, platform, deviceModel, osVersion, appVersion } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Device push token is required' });
    }

    const device = await FcmService.registerDeviceToken(userId, {
      token,
      platform,
      deviceModel,
      osVersion,
      appVersion
    });

    res.status(200).json({
      success: true,
      message: 'Device token registered successfully for push notifications',
      device
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/notifications/devices - Deactivate device token (on logout)
notificationRouter.delete('/devices', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (token) {
      await FcmService.unregisterDeviceToken(token);
    }
    res.status(200).json({ success: true, message: 'Device push token deactivated' });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/notifications/me - In-app notification inbox with category filters
notificationRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const type = req.query.type ? (req.query.type as string) : undefined;

    const result = await FcmService.getUserNotifications(userId, page, limit, type);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/notifications/:id/read - Mark notification as read
notificationRouter.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await FcmService.markAsRead(userId, id);
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/notifications/read-all - Mark all user notifications as read
notificationRouter.patch('/read-all', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await FcmService.markAllAsRead(userId);
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});
