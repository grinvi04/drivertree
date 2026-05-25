import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * 루트 응답 — 서비스 식별 + 헬스 정보 (Railway healthcheckPath가 이걸 봄)
   */
  getHealth(): {
    status: string;
    service: string;
    version: string;
    timestamp: string;
  } {
    return {
      status: 'ok',
      service: 'drivetree-backend',
      version: process.env.npm_package_version ?? '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
