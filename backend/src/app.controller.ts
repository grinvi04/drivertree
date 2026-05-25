import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Root + health check endpoint
   * - Railway healthcheckPath: "/api" 가 200을 받으면 컨테이너 살아있다고 판단
   * - 글로벌 throttler가 너무 공격적으로 health check를 막지 않도록 default 60/min 그대로 사용
   */
  @Get()
  getHello(): { status: string; service: string; version: string; timestamp: string } {
    return this.appService.getHealth();
  }

  /**
   * 명시적 /api/health 엔드포인트 — uptime monitor / load balancer가 사용
   * 단순히 process 살아있음만 확인 (DB ping은 별도 /health/db 로 추후 추가)
   */
  @Get('health')
  @Throttle({ default: { limit: 600, ttl: 60_000 } }) // health check는 분당 600회 허용
  health(): { status: 'ok'; uptime: number; timestamp: string } {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
