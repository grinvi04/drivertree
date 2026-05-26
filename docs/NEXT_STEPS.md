# 🗒️ DriveTree — 작업 계획 (NEXT_STEPS)

> 새 세션에서 이 프로젝트를 다시 이어받을 때 가장 먼저 읽을 문서.
> **작업 이력이 아닌 앞으로 할 일의 계획**을 관리한다.
> Claude/AI Agent에게 "PRD.md + README.md + docs/AI_LOG.md + docs/NEXT_STEPS.md 먼저 읽고 시작해줘" 라고만 해도 5분 안에 따라잡을 수 있도록 정리.

---

## 0. 현재 상태 스냅샷 (2026-05-26 기준)

| 항목 | 상태 |
|---|---|
| 백엔드 MVP | ✅ NestJS 11 + Prisma 7 + pgvector + JWT + Rate Limiting + 챗봇(RAG+폴백) + 계산기 2종 |
| 프론트엔드 MVP | ✅ Next.js 16 + React 19 + Tailwind v4 — 메인/상세/계산기/관리자 |
| 보안 | ✅ Admin credentials 제거, Rate Limiting, 프롬프트 인젝션 방어, XSS 이중 sanitize, CSP 헤더 |
| 코드 품질 (v1.3.0) | ✅ GeminiService DI, RAG_CONFIG 상수화, types/index.ts 공유 타입, ApiError, useAsyncData 훅, lint 0 경고 |
| CI 파이프라인 | ✅ GitHub Actions — lint + build + test (feature/fix/hotfix/develop/main 전체 트리거) |
| 스테이징 환경 | ✅ Railway Staging (`develop` 브랜치) + Neon staging DB branch + Vercel Preview 환경변수 분리 |
| 브랜치 보호 | ✅ `main` PR 필수 + CI 통과 필수, `develop` CI 통과 필수 |
| 프로덕션 배포 | ✅ Railway Production + Vercel Production + Neon Production DB |
| 관측성 | ✅ AllExceptionsFilter + RequestLoggerMiddleware + NestJS Logger |

---

## 1. 작업 계획 (우선순위 순)

### P0 — 지금 당장

- [ ] **스테이징 배포 확인** — Railway 대시보드에서 staging 서비스 첫 배포 성공 확인
  - `https://drivertree-staging.up.railway.app/api` → `Hello World!` 응답
  - Vercel Preview 빌드 URL → 스테이징 백엔드 정상 연결 확인
  - Neon staging branch 마이그레이션 + 시드 적재 확인

### P1 — 포트폴리오 강화 (이번 주)

- [ ] **공공 API 기능 추가** (Gemini 대체)
  - 챗봇 RAG/Gemini 연동은 제외 결정 (2026-05-26)
  - 대신 공공 API를 활용한 실용적인 기능 추가 예정
  - 후보: 도로교통공단 API (교통사고/면허 데이터), 기상청 API (날씨 기반 운전 안전 알림), 경찰청 공공데이터 (단속 카메라 위치, 도로 공사 정보)
  - 구체적인 API 선택은 별도 세션에서 결정

- [ ] **AI_LOG 강화** — 면접 답변 재료 확보
  - GeminiService DI 도입 과정 (기술 결정 이유, 트레이드오프)
  - Prisma 7 driver adapter 전환 경험
  - React 19 Compiler 신규 lint 규칙 대응 (`set-state-in-effect`, `immutability`)
  - 스테이징 환경 구축 (Railway API GraphQL 직접 호출 방식)

### P2 — SEO / 검색 노출 (2~3주 내)

- [ ] **`/content/[slug]` SSG/ISR 전환**
  - 현재: CSR. 목표: `generateStaticParams` + `revalidate: 3600`
  - 검색 엔진 크롤링 가능, OG 이미지 자동 생성

- [ ] **sitemap.xml 생성** — `/sitemap.xml` 라우트 → 콘텐츠 slug 동적 생성

- [ ] **GitHub README 스크린샷/다이어그램** — 포트폴리오 첫인상 개선

### P3 — 보안 완성 (배포 안정화 후)

- [ ] **JWT httpOnly 쿠키 마이그레이션**
  - 현재: `localStorage` 저장 (XSS 발생 시 토큰 탈취 위험)
  - 목표: `httpOnly + Secure + SameSite=Lax` 쿠키로 전환
  - 백엔드: 쿠키 발급 엔드포인트, 프론트: `credentials: 'include'` 변경

- [ ] **Sentry 연동**
  - `@sentry/node` 설치 → `all-exceptions.filter.ts` TODO 위치에 `Sentry.captureException` 추가
  - `SENTRY_DSN` env 추가 (Railway Variables)
  - 프론트: `@sentry/nextjs` 별도 셋업

### P4 — 배포 옵션 B (포트폴리오 심화)

- [ ] **AWS 풀스택 구성** — Railway/Vercel/Neon 안정화 후
  - CloudFront + S3 + Amplify (프론트) 또는 Vercel 유지
  - ECS Fargate + ALB (백엔드) — Docker 이미지 → ECR → Fargate
  - RDS PostgreSQL 16 + pgvector 또는 Neon 유지
  - Route 53 + ACM (도메인/SSL)
  - `docs/DEPLOYMENT_AWS.md` 신설

---

## 2. 보류된 항목

- ⏸️ **사용자 가치 검증 (인터뷰)** — `docs/USER_RESEARCH.md` 준비 완료, 재개 시 그대로 사용
- ⏸️ **Gemini 비용 모니터링** — 일일 호출 횟수 로깅, 임계치 알림

---

## 3. 배포된 환경 URL

| 환경 | 프론트엔드 | 백엔드 | DB |
|---|---|---|---|
| **Local** | `http://localhost:3000` | `http://localhost:4000` | Local PostgreSQL |
| **Staging** | Vercel Preview URL (develop 푸시 시 자동 생성) | `https://drivertree-staging.up.railway.app` | Neon `staging` branch |
| **Production** | `https://drivetree.vercel.app` | Railway Production URL | Neon `main` branch |

> Railway/Vercel 실제 도메인은 각 대시보드에서 확인. 토큰 이름은 모두 `drivetree-cli`.

---

## 4. 알려진 트러블슈팅 메모

### Prisma 7 (현재 7.8.0) — 매우 중요
- `@prisma/adapter-pg` + `pg` + `previewFeatures = ["driverAdapters"]` 구성 사용 중.
- `schema.prisma`의 datasource `url`은 `prisma.config.ts`에서만 관리. 의존성 변경 후 반드시 `npx prisma generate`.

### React 19 Compiler 신규 lint 규칙
- `react-hooks/set-state-in-effect`: effect body에서 동기 setState 금지 → async 함수 안으로 이동.
- `react-hooks/immutability`: effect deps로 전달되는 함수는 `useCallback`으로 안정화 필수.
- `react-hooks/preserve-manual-memoization`: `useCallback/useMemo`는 참조하는 `useEffect`보다 **먼저** 선언.
- `eslint.config.mjs`에서 warning으로 완화 처리하지 않은 규칙은 CI 실패.

### 백엔드 prettier 미실행 → CI lint 실패
- 백엔드 소스 수정 후 `cd backend && npm run format` 없이 push하면 CI `lint:check` 80+ 에러. **항상 format 선행.**

### npm 10.x + wasm32 optional 패키지 lock 버그
- 프론트 CI는 `npm install` 사용 (not `npm ci`). CI workflow 변경 금지.

### 한국어 정규식 사이 단어 허용
- `\s*` 대신 `.*?` (lazy wildcard) 사용. 수식어가 끼면 `\s*`로 미매칭.

### Railway API 직접 호출
- CLI(`RAILWAY_TOKEN` env) 인증 실패 시 GraphQL API 직접 사용: `https://backboard.railway.app/graphql/v2`, `Authorization: Bearer <token>`.
- `me` 쿼리는 실패할 수 있음. `projects` 쿼리는 동작.

---

## 5. 새 세션 시작 시 입력 템플릿

```
DriveTree 프로젝트 이어서 작업.
먼저 PRD.md, README.md, docs/AI_LOG.md, docs/NEXT_STEPS.md를 읽고 현재 상태 파악해줘.

오늘 작업 목표: [여기에 구체적으로]
  예) "Gemini API Key 채우고 RAG 품질 검증 + AI_LOG 스크린샷 추가"
  예) "/content/[slug] SSG 전환 + sitemap.xml 추가"
  예) "JWT httpOnly 쿠키 마이그레이션"
```
