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
    req.user = {
      id: payload.id,
      isSystemAdmin: payload.isSystemAdmin || false
    };
    next();
  } catch (err) {
    next(new AppError('Invalid token', 401));
  }
};
