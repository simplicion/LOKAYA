import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]: ', err);

  // 1. Application-defined operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // 2. Prisma Database Connection / Initialization Failure (e.g. P1001)
  const isPrismaInitError = 
    err?.name === 'PrismaClientInitializationError' || 
    err?.code === 'P1001' || 
    (typeof err?.message === 'string' && err.message.includes("Can't reach database server"));

  if (isPrismaInitError) {
    return res.status(503).json({
      status: 'error',
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database service is temporarily unavailable. Please verify database connectivity and try again shortly.',
    });
  }

  // 3. Prisma Unique Constraint Violation (e.g. P2002)
  if (err?.code === 'P2002') {
    const target = Array.isArray(err?.meta?.target) ? err.meta.target.join(', ') : 'field';
    return res.status(409).json({
      status: 'error',
      code: 'DUPLICATE_ENTRY',
      message: `A record with this ${target} already exists.`,
    });
  }

  // 4. Default unhandled internal server errors (mask internal paths & DB credentials)
  const isProd = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    status: 'error',
    message: isProd ? 'An unexpected internal error occurred. Please try again later.' : (err.message || 'Internal server error'),
    ...(!isProd && { stack: err.stack }),
  });
};

