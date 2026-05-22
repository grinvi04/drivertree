import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { ContentModule } from './content/content.module';
import { ChatModule } from './chat/chat.module';
import { CalculatorModule } from './calculator/calculator.module';

@Module({
  imports: [
    // 전역 Rate Limit — 분당 60회 (모든 라우트 기본값).
    // /chat/ask 같은 비용 민감 라우트는 short/long throttler로 라우트 레벨 오버라이드.
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 60 },
      { name: 'short', ttl: 60_000, limit: 10 },
      { name: 'long', ttl: 3_600_000, limit: 60 },
    ]),
    PrismaModule,
    AuthModule,
    ContentModule,
    ChatModule,
    CalculatorModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
