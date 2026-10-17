import type { Request, Response, NextFunction } from 'express';

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminSecret = process.env.ADMIN_SECRET;

  // If no admin secret configured, allow access (local dev mode)
  if (!adminSecret || adminSecret.trim() === '') {
    return next();
  }

  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.adminSecret) {
    token = String(req.query.adminSecret).trim();
  } else if (req.headers['x-admin-secret']) {
    token = String(req.headers['x-admin-secret']).trim();
  }

  if (token === adminSecret) {
    return next();
  }

  res.status(401).json({
    error: 'Unauthorized',
    message: 'Valid admin authentication token required for this operation.',
  });
}

export function validateOverlayToken(req: Request, res: Response, next: NextFunction): void {
  const overlayToken = process.env.OVERLAY_TOKEN;

  // If no overlay token requirement configured, allow
  if (!overlayToken || overlayToken.trim() === '') {
    return next();
  }

  const token = req.query.token as string | undefined;
  if (!token || token !== overlayToken) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid or missing overlay access token.',
    });
    return;
  }

  next();
}
