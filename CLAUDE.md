# DriveTree — Claude Code 작업 규칙

## 디자인 레퍼런스

UI/프론트엔드 작업을 시작하기 전에 **반드시** 아래 두 파일을 읽을 것.

| 파일 | 목적 |
|---|---|
| [`DESIGN.md`](./DESIGN.md) | Apple 디자인 시스템 원본 스펙 — 색상 토큰, 타이포그래피, 컴포넌트 정의, Do's/Don'ts |
| [`DESIGN_IMPL.md`](./DESIGN_IMPL.md) | DriveTree 구현 노트 — CSS 변수 매핑, 유틸리티 클래스, 페이지 섹션 구조, 체크리스트 |

> **읽는 순서**: DESIGN.md(의도) → DESIGN_IMPL.md(구현) → 작업 시작

---

## 멀티에이전트 슬래시 커맨드

역할별 에이전트를 병렬로 실행하는 커맨드. `.claude/commands/`에 정의되어 있다.

| 커맨드 | 역할 | 병렬 에이전트 |
|---|---|---|
| `/feature-add <name> "<설명>"` | 피처 개발 | 백엔드(NestJS scaffold) + 프론트엔드(Next.js scaffold) |
| `/release-check` | 배포 전 게이트 | 백엔드 품질 + 프론트엔드 품질 + 보안 검토 |
| `/content-add "<주제>" <category>` | 가이드 콘텐츠 추가 | 본문 작성 + SEO 메타데이터 생성 |
| `/design-qa` | 디자인 QA | Apple 토큰 준수 검토 + WCAG 접근성 검토 |

---

## Git Flow

이 프로젝트는 **git flow**를 사용한다. 아래 규칙을 반드시 지킬 것.

### 브랜치 구조

| 브랜치 | 용도 | 직접 커밋 |
|---|---|---|
| `main` | 운영 릴리즈만 | ❌ 금지 |
| `develop` | 통합 브랜치 | ❌ 금지 |
| `feature/*` | 신규 기능 | ✅ |
| `fix/*` | 버그 수정 (비긴급) | ✅ |
| `hotfix/*` | 운영 긴급 수정 | ✅ |
| `release/*` | 릴리즈 준비 | ✅ |

### 작업 흐름

**기능 개발 / 버그 수정 (비긴급)**
```
develop → feature/xxx 또는 fix/xxx → develop (merge --no-ff)
```
1. `git checkout -b feature/xxx develop`
2. 작업 후 커밋
3. `git checkout develop && git merge --no-ff feature/xxx`
4. 브랜치 삭제

**긴급 운영 수정 (hotfix)**
```
main → hotfix/xxx → main (tag) + develop (merge --no-ff)
```
1. `git checkout -b hotfix/xxx main`
2. 수정 후 커밋
3. `git checkout main && git merge --no-ff hotfix/xxx && git tag vX.X.X`
4. `git checkout develop && git merge --no-ff hotfix/xxx`  ← **반드시 develop에도 반영**
5. 브랜치 삭제

**릴리즈**
```
develop → release/vX.X.X → main (tag) + develop (merge --no-ff)
```
1. `git checkout -b release/vX.X.X develop`
2. 버전 번호·CHANGELOG 수정
3. `git checkout main && git merge --no-ff release/vX.X.X && git tag vX.X.X`
4. `git checkout develop && git merge --no-ff release/vX.X.X`
5. 브랜치 삭제

### 핵심 규칙 요약

- `main`과 `develop`에 **직접 커밋 금지** — 반드시 브랜치를 거친다
- hotfix는 `main`과 `develop` **양쪽에 머지** — 어느 하나라도 빠지면 코드 분기
- 머지는 항상 `--no-ff` — 히스토리에 브랜치 흔적을 남긴다
- 브랜치 완료 후 삭제
- 릴리즈마다 `git tag vX.X.X`

---

## 커밋 메시지 규칙

모든 커밋 메시지는 **한국어**로 작성한다.

### 형식
```
타입(범위): 제목  ← 50자 이내, 마침표 없음

본문               ← 선택. 변경 이유 위주, 72자 줄바꿈

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>  ← Claude Code 작업 시 필수
```

### 타입 목록

| 타입 | 의미 |
|---|---|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `hotfix` | 운영 긴급 수정 |
| `refactor` | 기능 변화 없는 코드 개선 |
| `style` | 포맷, 세미콜론 등 코드 변경 없음 |
| `test` | 테스트 추가·수정 |
| `docs` | 문서 변경 |
| `chore` | 빌드, 설정, 패키지 등 |
| `perf` | 성능 개선 |
| `ci` | CI/CD 변경 |

### 범위 예시
`backend`, `frontend`, `auth`, `chat`, `ci`, `docs`, `layout`, `계산기`, `챗봇`

### 예시
```
feat(챗봇): 모바일 다이얼로그 전체 화면 전환

고정 너비(350px)가 320px 기기에서 잘리는 문제 수정.
모바일에서 fixed + inset으로 뷰포트 가득 채우도록 변경.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
```
fix(계산기): col-span-2.5 → 유효한 Tailwind 클래스로 교체
```
```
docs(claude): 커밋 메시지 한국어 규칙 추가
```

---

## 커밋 전 필수 체크리스트

```bash
# 백엔드 수정 시
cd backend && npm run format   # prettier — CI lint 실패 방지
cd backend && npm run lint:check
cd backend && npm test         # 100% 통과 확인

# 프론트엔드 수정 시
cd frontend && npm run build   # 빌드 에러 없는지 확인
```

## 백엔드/프론트엔드 CI install

`.github/workflows/ci.yml`에서 백엔드·프론트 모두 `npm install` 사용 (not `npm ci`).
npm 10.x + wasm32/emnapi optional 패키지 lock 파일 버그 우회용이므로 변경하지 말 것.

---

## NestJS 모듈 추가 패턴

새 NestJS 모듈(`feature-name`)을 추가할 때 **반드시** 이 패턴을 따른다.

### 생성 파일 목록

```
backend/src/feature-name/
  feature-name.module.ts      ← @Module 선언
  feature-name.controller.ts  ← HTTP 라우팅, @ApiTags, @ApiOperation
  feature-name.service.ts     ← 비즈니스 로직, private readonly logger
  feature-name.dto.ts         ← CreateDto, UpdateDto, ResponseDto (class-validator)
  feature-name.service.spec.ts ← 서비스 유닛 테스트
```

### 체크리스트

1. `feature-name.module.ts` — `CommonModule` import (PrismaService, GeminiService 등 공유 의존성)
2. `feature-name.service.ts` — `private readonly logger = new Logger(FeatureNameService.name)` 필수
3. `feature-name.dto.ts` — 모든 필드에 `@ApiProperty` + `class-validator` 데코레이터
4. `backend/src/app.module.ts` — `imports` 배열에 새 모듈 등록
5. `feature-name.service.spec.ts` — 서비스 생성 즉시 스펙 파일 작성 (CLAUDE.md 테스트 규칙 준수)

### 예외 처리 패턴

```typescript
// 없는 리소스
throw new NotFoundException('리소스를 찾을 수 없습니다.');
// 중복
throw new ConflictException('이미 존재합니다.');
// 권한 없음
throw new UnauthorizedException('권한이 없습니다.');
// 잘못된 입력
throw new BadRequestException('입력값이 올바르지 않습니다.');
```

---

## 프론트엔드 코드 규칙

### 페이지 파일 구조

```typescript
// frontend/src/app/[feature]/page.tsx 기본 구조
'use client'; // CSR이 필요한 경우만

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { TypeName } from '@/types';

export default function FeaturePage() {
  // 1. state 선언
  // 2. useEffect / 데이터 패칭
  // 3. 핸들러 함수
  // 4. return JSX
}
```

### 컴포넌트 규칙

- **`'use client'`는 필요할 때만** — SSG 가능한 컴포넌트는 서버 컴포넌트로 유지
- **Tailwind 클래스만 사용** — `style=` prop 사용 금지 (인라인 스타일 금지)
- **아이콘은 lucide-react named import** — `import { IconName } from 'lucide-react'`
- **API 호출은 `@/lib/api` 통해서만** — 직접 `fetch` 호출 금지
- **타입은 `@/types/index.ts`에서 관리** — 컴포넌트 파일에 인터페이스 정의 금지

### 에러 처리 패턴

```typescript
const [error, setError] = useState<string | null>(null);

try {
  const result = await api.someMethod();
} catch (e) {
  setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
}
```

### 새 API 함수 추가 시

1. `frontend/src/lib/api.ts` — `api` 객체에 메서드 추가
2. `frontend/src/types/index.ts` — 응답 타입 인터페이스 추가
3. 환경변수 없음 — `BASE_URL`은 `NEXT_PUBLIC_API_URL`로 이미 관리됨

---

## 환경변수 관리

새 환경변수를 추가할 때 **모든 위치**를 동시에 수정한다.

### 백엔드 환경변수 추가 체크리스트

| 파일 | 액션 |
|---|---|
| `backend/.env` | 실제 값 추가 (gitignore됨) |
| `backend/.env.example` | placeholder 값으로 추가 |
| `backend/src/...` | 사용 코드에서 `process.env.VAR_NAME` 참조 |
| Railway Dashboard | Staging + Production 양쪽에 env var 추가 |

### 프론트엔드 환경변수 추가 체크리스트

| 파일 | 액션 |
|---|---|
| `frontend/.env.local` | 실제 값 추가 (gitignore됨) |
| `frontend/.env.local.example` | placeholder 값으로 추가 |
| Vercel Dashboard | `NEXT_PUBLIC_` prefix면 모든 환경, 아니면 서버 전용 |

> **주의**: `NEXT_PUBLIC_` prefix 없는 프론트 env var는 클라이언트에 노출되지 않음.

---

## Prisma 스키마 변경 워크플로우

```bash
# 1. schema.prisma 수정

# 2. 개발 환경 마이그레이션 생성 + 적용
cd backend && npx prisma migrate dev --name 설명적인_마이그레이션명

# 3. Prisma 클라이언트 재생성 (자동이지만 명시적으로)
cd backend && npx prisma generate

# 4. 타입스크립트 오류 확인 후 커밋
cd backend && npm run lint:check
```

> Railway 운영 DB는 배포 시 `npx prisma migrate deploy`가 자동 실행됨 (`package.json` start script 확인).

---

## 테스트 규칙

### 핵심 원칙

- **모든 테스트는 100% 통과** 상태를 유지한다 — failing 테스트가 있으면 커밋하지 않는다.
- `npm test` (backend) 기준: 새 파일을 추가할 때마다 스펙 파일도 함께 작성한다.
- 테스트는 `*.spec.ts` 패턴으로 `src/` 안에 위치시킨다.

### 유닛 테스트 (서비스 레이어)

- **외부 의존성은 항상 Mock** — `PrismaService`, `JwtService` 등 외부 서비스는 jest.fn() stub으로 교체한다.
- **실제 DB 연결 금지** — `$transaction`, `$executeRawUnsafe`도 mock 처리한다.
- Private 메서드 접근이 필요하면 `(service as unknown as { method: ... }).method()` 패턴을 사용한다.
- Mock 설정은 `beforeEach`에서 매 테스트마다 초기화한다.

### 테스트 범위 기준

| 레이어 | 커버 범위 | 비고 |
|---|---|---|
| 서비스 비즈니스 로직 | 정상 경로 + 모든 예외 경로 | NotFoundException, ConflictException, UnauthorizedException 등 |
| 순수 도메인 함수 | 입출력 계약, 경계값, 단조성 | 계산기 수식, 청킹 로직 등 |
| 보안 핵심 로직 | 모든 인젝션 패턴 + 정상 입력 | 프롬프트 인젝션 감지기 등 |
| Controller / DTO | 필수 검증 룰 | 별도 e2e 테스트로 다룬다 |

### 테스트 작성 순서

1. 정상 경로(happy path) 먼저 — 기대 반환값, 의존성 호출 여부
2. 예외 경로 — 각 `throw`마다 1개 테스트
3. 경계값·edge case — 빈 배열, 0, null, 빈 문자열 등

### 커밋 전 확인

```bash
cd backend && npm test   # 모든 테스트 통과 확인
cd backend && npm run lint:check   # lint 0 errors
```
