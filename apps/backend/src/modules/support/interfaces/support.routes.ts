import { Router, Request, Response, NextFunction } from 'express';
import { SupportService } from '../application/support.service';
import { requireAuth } from '../../../shared/middleware/auth';

const router: Router = Router();

// Raise a Support Ticket
router.post('/tickets', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const ticket = await SupportService.createTicket(userId, req.body);
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// Get User's Support Tickets
router.get('/tickets/my', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const tickets = await SupportService.getUserTickets(userId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
});

// Get Single Ticket by ID
router.get('/tickets/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const isAdmin = (req as any).user.role === 'SYSTEM_ADMIN';
    const ticket = await SupportService.getTicketById(userId, req.params.id, isAdmin);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

export const supportRoutes = router;
