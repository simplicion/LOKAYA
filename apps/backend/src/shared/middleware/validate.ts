import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

export const validateRequest = (schema: ZodTypeAny) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isWrapped = 'shape' in schema && (schema as any).shape && ('body' in (schema as any).shape || 'query' in (schema as any).shape || 'params' in (schema as any).shape);
      if (isWrapped) {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
      } else {
        await schema.parseAsync(req.body);
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        const fieldName = firstError?.path?.length ? firstError.path.join('.') : 'Form';
        const errorDetail = firstError ? `${fieldName}: ${firstError.message}` : 'Validation failed';
        return res.status(400).json({
          status: 'error',
          message: errorDetail,
          errors: error.errors,
        });
      }
      return next(error);
    }
  };
