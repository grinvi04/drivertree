import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * 응답 상태 코드를 결정한다.
   *
   * HttpException 은 getStatus() 그대로. 그 외(비-HttpException)라도 body-parser 가 던지는
   * 입력오류는 status/statusCode 에 4xx 를 실어 보낸다(깨진 JSON SyntaxError=400,
   * PayloadTooLargeError=413). 이 4xx 는 존중해 클라이언트 오류로 응답하고,
   * status 가 없거나 5xx 인 경우만 500(서버오류)로 흡수한다 — 클라이언트 입력 오류가
   * on-call 알람·에러지표를 오염시키지 않도록 한다(api-standards "5xx 흡수 금지").
   */
  private static resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    const raw = exception as { status?: unknown; statusCode?: unknown };
    const candidate =
      typeof raw?.status === 'number'
        ? raw.status
        : typeof raw?.statusCode === 'number'
          ? raw.statusCode
          : undefined;
    if (candidate !== undefined && candidate >= 400 && candidate < 500) {
      return candidate;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = AllExceptionsFilter.resolveStatus(exception);

    const errorBody =
      exception instanceof HttpException ? exception.getResponse() : null;
    const message =
      typeof errorBody === 'string'
        ? errorBody
        : ((errorBody as { message?: string | string[] })?.message ??
          (exception instanceof Error ? exception.message : 'Internal error'));

    const isServerError = status >= 500;
    const logMessage = `${request.method} ${request.originalUrl} → ${status} :: ${Array.isArray(message) ? message.join('; ') : message}`;

    if (isServerError) {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : undefined,
      );
      // SENTRY_DSN 환경변수가 설정된 경우에만 Sentry로 전송
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(exception, {
          extra: {
            method: request.method,
            url: request.originalUrl,
            status,
          },
        });
      }
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      message: Array.isArray(message) ? message.join('; ') : message,
    });
  }
}
