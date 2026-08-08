import { Request, Response, NextFunction } from 'express';

export function requireRole(...allowedRoles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient role permissions for this resource' },
      });
    }
    next();
  };
}
