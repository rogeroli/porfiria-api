import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

interface ApiErrorBody {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  error: {
    message: string | string[];
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<FastifyReply>();
    const request = context.getRequest<FastifyRequest>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ApiErrorBody = {
      success: false,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: {
        message: this.getMessage(exception),
      },
    };

    response.status(statusCode).send(body);
  }

  private getMessage(exception: unknown): string | string[] {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (this.isRecord(response) && this.hasMessage(response)) {
      return response.message;
    }

    return exception.message;
  }

  private hasMessage(value: Record<string, unknown>): value is { message: string | string[] } {
    return typeof value.message === 'string' || this.isStringArray(value.message);
  }

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
