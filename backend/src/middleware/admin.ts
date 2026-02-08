import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.userRole !== 'ADMIN') {
    return next(new ForbiddenError('Admin access required'));
  }
  next();
};
