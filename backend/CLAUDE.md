# Backend — NestJS 11 / Prisma 7 / Jest 30

## 버전 고정 (이 버전 외 API 사용 금지)

- `@nestjs/common` ^11 · `prisma` ^7 · `jest` ^30 · `class-validator` ^0.15 · `@nestjs/swagger` ^11

---

## 모듈 구조

```
src/feature/
  feature.module.ts      ← @Module({ imports: [CommonModule] })
  feature.controller.ts  ← 라우팅만. 비즈니스 로직 금지
  feature.service.ts     ← 비즈니스 로직. private readonly logger 필수
  feature.dto.ts         ← class-validator + @ApiProperty 모든 필드
  feature.service.spec.ts
```

- `PrismaService`·`GeminiService` → `CommonModule` import 시 자동 주입
- 새 모듈은 `app.module.ts` imports 배열에 등록 필수

---

## Prisma 7 — 반드시 지킬 것

```typescript
// ✅ DI로 주입받은 PrismaService만 사용
constructor(private readonly prisma: PrismaService) {}

// ✅ Raw SQL은 Prisma.sql 템플릿만 허용
await this.prisma.$queryRaw<T[]>(Prisma.sql`SELECT * WHERE id = ${id}`);

// ❌ new PrismaClient()        — 어댑터 미적용, 연결 실패
// ❌ $queryRawUnsafe(string)   — SQL 인젝션 위험
```

---

## 예외 처리 — NestJS 내장 예외만 사용

```typescript
import {
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common'
// ❌ new Error() / throw '문자열' — AllExceptionsFilter 일관성 깨짐
```

---

## DTO — class 기반만 허용

```typescript
export class CreateItemDto {
  @ApiProperty({ example: '비보호 좌회전' })
  @IsString()
  @IsNotEmpty()
  title: string
}
// ❌ interface 사용 금지 — ValidationPipe(transform:true) 동작 안 함
```

---

## 테스트 (Jest 30)

```typescript
// 외부 의존성은 반드시 Mock — 실제 DB 연결 금지
{ provide: PrismaService, useValue: { model: { findUnique: jest.fn() } } }

// beforeEach에서 초기화 필수
beforeEach(() => jest.clearAllMocks());

// Private 메서드 접근
(service as unknown as { method: () => void }).method();
```

---

## 제약 규칙

- `any` 타입 금지 — `unknown` + 타입 가드 사용
- Controller에 비즈니스 로직 작성 금지
- 새 환경변수 → `.env.example` 동시 업데이트 필수
- 마이그레이션 파일 직접 수정 금지 — `prisma migrate dev`로만 생성
- 테스트 없이 커밋 금지 — 100% 통과 후 커밋
