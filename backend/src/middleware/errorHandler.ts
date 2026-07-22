import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten() });
  }

  logger.error(err);
  
  const isProduction = process.env.NODE_ENV === 'production';
  const message = err instanceof Error 
    ? (isProduction ? 'Internal server error' : err.message) 
    : 'Internal server error';
    
  res.status(500).json({ error: message });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
