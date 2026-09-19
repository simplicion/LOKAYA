import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { prisma } from '@workspace/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    isSystemAdmin: boolean;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return next(new AppError('Unauthorized', 401));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const userId = payload.id || payload.userId;

    // Authoritative check: ensure user actually exists in the database
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isSystemAdmin: true }
    });

    if (!dbUser) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return next(new AppError('User account not found or deleted. Please register or log in again.', 401));
    }

    req.user = {
      id: dbUser.id,
      isSystemAdmin: dbUser.isSystemAdmin || false
    };
    next();
  } catch (err) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    next(new AppError('Invalid or expired session token', 401));
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isSystemAdmin) {
    return next(new AppError('Forbidden: Admin access required', 403));
  }
  next();
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const userId = payload.id || payload.userId;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isSystemAdmin: true }
    });

    if (dbUser) {
      req.user = {
        id: dbUser.id,
        isSystemAdmin: dbUser.isSystemAdmin || false
      };
    }
    next();
  } catch {
    next();
  }
};

