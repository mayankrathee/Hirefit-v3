import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.headers['x-request-id'];

    return next.handle().pipe(
      map((data) => {
        // If data is already formatted (has success property), return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Handle pagination response
        if (data && typeof data === 'object' && 'items' in data && 'total' in data) {
          return {
            success: true,
            data: data.items,
            meta: {
              timestamp: new Date().toISOString(),
              requestId,
              pagination: {
                page: data.page || 1,
                pageSize: data.pageSize || data.items.length,
                total: data.total,
                totalPages: Math.ceil(data.total / (data.pageSize || data.items.length)),
              },
            },
          };
        }

        return {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }),
    );
  }
}

