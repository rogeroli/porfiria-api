import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

interface ApiSuccessBody<TData> {
  success: true;
  data: TData;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor<unknown, ApiSuccessBody<unknown>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ApiSuccessBody<unknown>> {
    return next.handle().pipe(
      map((data: unknown) => ({
        success: true,
        data,
      })),
    );
  }
}
