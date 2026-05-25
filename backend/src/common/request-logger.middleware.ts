import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * HTTP 요청·응답 로깅 미들웨어
 *
 * 모든 들어오는 요청에 대해 (method, url, status, durationMs, contentLength, ua) 를
 * 구조화 형식으로 출력한다. 단순한 console.log 대신 NestJS Logger를 써서
 * 컨텍스트와 타임스탬프가 자동 부착되며, 향후 Pino 같은 JSON 로거로 갈아끼울 때
 * 변경 영역이 최소화된다.
 *
 * - /api 헬스체크는 noise가 크므로 status 200인 경우 debug 레벨로 강등
 * - 4xx → warn, 5xx → error 로 자동 분기되어 운영 필터링이 쉬움
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    const { method, originalUrl } = req;
    const ua = req.get('user-agent') ?? '-';

    res.on('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const { statusCode } = res;
      const contentLength = res.get('content-length') ?? '-';
      const line = `${method} ${originalUrl} ${statusCode} ${contentLength}b ${durationMs.toFixed(1)}ms ua="${ua}"`;

      if (statusCode >= 500) {
        this.logger.error(line);
      } else if (statusCode >= 400) {
        this.logger.warn(line);
      } else if (originalUrl === '/api' || originalUrl === '/api/health') {
        // 헬스체크 소음 줄이기 — debug 레벨은 NEST_LOG_LEVEL=debug 시에만 표시
        this.logger.debug(line);
      } else {
        this.logger.log(line);
      }
    });

    next();
  }
}
