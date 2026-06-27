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

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

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
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      message: Array.isArray(message) ? message.join('; ') : message,
    })
  }
}
