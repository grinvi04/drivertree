import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import * as Sentry from '@sentry/node'

// body-parser가 던지는 에러(SyntaxError, PayloadTooLargeError)는 status/statusCode를 가짐.
// 4xx만 통과 — 5xx non-HttpException은 신뢰할 수 없으므로 500으로 유지.
function resolveStatus(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus()
  const e = exception as Record<string, unknown>
  const code = (e['status'] as number | undefined) ?? (e['statusCode'] as number | undefined)
  if (typeof code === 'number' && code >= 400 && code < 500) return code
  return HttpStatus.INTERNAL_SERVER_ERROR
}

// TypeScript numeric enum은 역방향 매핑을 가짐: HttpStatus[400] === 'BAD_REQUEST'
function statusToCode(status: number): string {
  return (HttpStatus as unknown as Record<number, string>)[status] ?? 'INTERNAL_SERVER_ERROR'
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status = resolveStatus(exception)
    const code = statusToCode(status)

    const errorBody = exception instanceof HttpException ? exception.getResponse() : null
    const message =
      typeof errorBody === 'string'
        ? errorBody
        : ((errorBody as { message?: string | string[] })?.message ??
          (exception instanceof Error ? exception.message : 'Internal error'))

    const isServerError = status >= 500
    const logMessage = `${request.method} ${request.originalUrl} → ${status} :: ${Array.isArray(message) ? message.join('; ') : message}`

    if (isServerError) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : undefined)
      // SENTRY_DSN 환경변수가 설정된 경우에만 Sentry로 전송
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(exception, {
          extra: {
            method: request.method,
            url: request.originalUrl,
            status,
          },
        })
      }
    } else {
      this.logger.warn(logMessage)
    }

    response.status(status).json({
      statusCode: status,
      code,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      message: Array.isArray(message) ? message.join('; ') : message,
    })
  }
}
