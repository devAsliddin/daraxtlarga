import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger('SecurityMiddleware');

  use(req: Request, res: Response, next: NextFunction) {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=self, geolocation=self, microphone=()',
    );
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "img-src 'self' data: blob: http://localhost:9000 http://minio:9000 https://*.tile.openstreetmap.org; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "connect-src 'self' ws: wss: http://localhost:* http://minio:*; ",
    );

    // Log suspicious requests
    const userAgent = req.headers['user-agent'] || '';
    if (
      userAgent.includes('sqlmap') ||
      userAgent.includes('nikto') ||
      req.url.includes('../') ||
      req.url.includes('<script')
    ) {
      this.logger.warn(`Suspicious request from ${req.ip}: ${req.method} ${req.url}`);
    }

    next();
  }
}
