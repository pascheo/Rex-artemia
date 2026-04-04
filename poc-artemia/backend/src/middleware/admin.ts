import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Accès réservé aux administrateurs' });
    return;
  }
  next();
}
