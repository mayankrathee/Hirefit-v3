import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Use existing request ID or generate new one
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    
    // Set on request for logging
    req.headers['x-request-id'] = requestId;
    
    // Include in response headers
    res.setHeader('X-Request-ID', requestId);
    
    next();
  }
}

