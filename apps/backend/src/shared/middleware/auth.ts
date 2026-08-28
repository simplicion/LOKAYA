import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    isSystemAdmin: boolean;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = {
      id: payload.id,
      isSystemAdmin: payload.isSystemAdmin || false
    };
    next();
  } catch (err) {
    next(new AppError('Invalid token', 401));
  }
};
