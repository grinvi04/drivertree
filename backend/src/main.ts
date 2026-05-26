import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, LogLevel, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * CORS origin callback 시그니처 — express의 cors 라이브러리 콜백 형태.
 */
type CorsOriginCallback = (err: Error | null, allow?: boolean) => void;

async function bootstrap(): Promise<void> {
  // NEST_LOG_LEVEL 환경변수로 운영/로컬 로그 노이즈 제어
  // 예: production은 "log,warn,error" / 디버그는 "log,warn,error,debug,verbose"
  const validLevels: readonly LogLevel[] = [
    'log',
    'warn',
    'error',
    'debug',
    'verbose',
    'fatal',
  ];
  const envLevels =
    process.env.NEST_LOG_LEVEL?.split(',').map((s) => s.trim()) ?? [];
  const logLevels: LogLevel[] =
    envLevels.length > 0
      ? envLevels.filter((l): l is LogLevel =>
          (validLevels as readonly string[]).includes(l),
        )
      : ['log', 'warn', 'error'];

  const app = await NestFactory.create(AppModule, { logger: logLevels });

  // 글로벌 API 경로 프리픽스 설정 (/api/...)
  app.setGlobalPrefix('api');

  // 모든 예외를 한 곳에서 처리 — 구조화 로깅 + 일관된 JSON 에러 응답
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS 활성화 — 배포 시 ALLOWED_ORIGINS 환경변수로 도메인 화이트리스트
  // 예: "https://drivetree.vercel.app,https://drivetree-preview.vercel.app"
  // 미설정 시 로컬 개발용 기본값(localhost:3000, 3001) 사용.
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS?.trim();
  const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: CorsOriginCallback,
    ): void => {
      // origin이 없는 경우(서버-서버, curl, 헬스체크 등) 허용
      if (!origin) {
        callback(null, true);
        return;
      }
      // Vercel 프리뷰 도메인(*.vercel.app) 자동 허용 — Vercel 미사용 시 무해
      const isVercelPreview = /\.vercel\.app$/.test(new URL(origin).hostname);
      if (allowedOrigins.includes(origin) || isVercelPreview) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked: ${origin}`), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 전역 DTO 입력 검증 파이프 적용
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 필드 자동 거름
      transform: true, // 입력 타입을 DTO 클래스 타입으로 자동 변환
    }),
  );

  // Swagger — production에서도 활성화 (팀/외부 개발자 참고용)
  // 필요 시 NODE_ENV === 'production' 조건으로 비활성화 가능
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DriveTree API')
    .setDescription('초보운전자 가이드 서비스 REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(
    `🚀 DriveTree Backend running on 0.0.0.0:${port}/api`,
  );
  new Logger('Bootstrap').log(
    `📖 Swagger UI: http://localhost:${port}/api/docs`,
  );
}
void bootstrap();
