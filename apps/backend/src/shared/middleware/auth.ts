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

  let userId: string;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    userId = payload.id || payload.userId;
  } catch (jwtErr) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return next(new AppError('Invalid or expired session token', 401));
  }

  try {
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
  } catch (dbErr: any) {
    // Database connection failure should NOT clear auth cookies or be reported as an expired token
    const isDbUnreachable = 
      dbErr?.name === 'PrismaClientInitializationError' || 
      dbErr?.code === 'P1001' || 
      (typeof dbErr?.message === 'string' && dbErr.message.includes("Can't reach database server"));

    if (isDbUnreachable) {
      return next(new AppError('Database service is temporarily unavailable. Please try again shortly.', 503));
    }

    return next(dbErr);
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

