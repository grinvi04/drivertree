import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 글로벌 예외 필터
 *
 * 모든 HttpException + 그 외 throw된 모든 예외를 한 곳에서 처리한다.
 * - 일관된 JSON 에러 응답 형태 보장 (프론트가 안전하게 파싱)
 * - 구조화 로그(context · path · method · status · stack)로 운영 가시성 확보
 * - Sentry DSN이 설정돼 있으면 향후 forward 가능한 훅 위치 표시
 *
 * 4xx 사용자 오류는 warn, 5xx 서버 오류는 error 레벨로 분리해
 * 운영 로그 필터링·알람 임계값 설정이 쉬워진다.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // HttpException 의 detail은 string|object — 안전하게 추출
    const errorBody =
      exception instanceof HttpException ? exception.getResponse() : null;
    const message =
      typeof errorBody === 'string'
        ? errorBody
        : ((errorBody as { message?: string | string[] })?.message ??
          (exception instanceof Error ? exception.message : 'Internal error'));

    const isServerError = status >= 500;
    const logPayload = {
      status,
      method: request.method,
      url: request.originalUrl,
      ip: request.ip,
      ua: request.get('user-agent'),
      message: Array.isArray(message) ? message.join('; ') : message,
    };

    if (isServerError) {
      this.logger.error(
        `${request.method} ${request.originalUrl} → ${status} :: ${logPayload.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      // SENTRY_DSN 환경변수가 설정되면 여기서 Sentry로 forward 가능
      // (현재는 의존성 미설치 — 운영 도입 시 @sentry/node + Sentry.captureException(exception) 추가)
    } else {
      this.logger.warn(
        `${request.method} ${request.originalUrl} → ${status} :: ${logPayload.message}`,
      );
    }

    // 클라이언트 응답 — 일관된 JSON 형태
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      message: logPayload.message,
    });
  }
}
