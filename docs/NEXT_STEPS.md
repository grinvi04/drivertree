# DriveTree — 작업 계획 (NEXT_STEPS)

> 새 세션에서 가장 먼저 읽을 문서. **앞으로 할 일**만 관리한다.
> "PRD.md + README.md + docs/AI_LOG.md + docs/NEXT_STEPS.md 읽고 시작해줘"

---

## 0. 현재 상태 스냅샷 (2026-05-27 기준)

| 항목 | 상태 |
|---|---|
| 백엔드 MVP | ✅ NestJS 11 + Prisma 7 + pgvector + 챗봇(RAG+폴백) + 계산기 2종 |
| 프론트엔드 MVP | ✅ Next.js 16 + React 19 + Tailwind v4 — 메인/상세/계산기/관리자 |
| 인증 | ✅ JWT httpOnly 쿠키 (Access 15분 + Refresh 7일 + DB 해시 검증) |
| 보안 | ✅ Rate Limiting · 프롬프트 인젝션 방어 · XSS sanitize · CSP 헤더 |
| API 품질 | ✅ 페이지네이션 + Swagger + 응답 DTO + 시드 분리 |
| 테스트 | ✅ Jest 유닛 테스트 53개 100% 통과 (AuthService + ContentService) |
| 관측 | ✅ AllExceptionsFilter (5xx→Sentry) + RequestLoggerMiddleware + 구조화 로깅 |
| 캐시 | ✅ 콘텐츠 목록 인메모리 60초 캐시 |
| SEO | ✅ 콘텐츠 상세 SSG + ISR (1시간) + sitemap.xml 자동 생성 |
| CI/CD | ✅ GitHub Actions (lint + build + test) — 브랜치 보호 + 스테이징/프로덕션 자동 배포 |
| 프로덕션 배포 | ✅ Railway Production + Vercel Production + Neon Production DB |
| 스테이징 배포 | ✅ Railway Staging (`develop`) + Vercel Preview + Neon Staging DB |

---

## 1. 작업 계획 (우선순위 순)

### P0 — 즉시 처리

- [ ] **Vercel `NEXT_PUBLIC_SITE_URL` 설정**
  - Vercel 대시보드 → Settings → Environment Variables → Production 환경에 추가
  - Key: `NEXT_PUBLIC_SITE_URL` / Value: `https://drivetree.vercel.app`
  - sitemap.xml에서 사용 (현재 fallback 값 `https://drivetree.vercel.app`으로 동작 중)

- [ ] **Sentry DSN 설정**
  - https://sentry.io 에서 Node.js 프로젝트 생성 → DSN 발급
  - Railway Production + Staging Variables에 `SENTRY_DSN` 추가
  - 프론트: `@sentry/nextjs` 셋업 (별도 작업)
  - 코드는 이미 완성됨 (`SENTRY_DSN` env가 있으면 자동 활성화)

### P1 — 공공 API 연동 ~~(진행 중)~~ → ❌ 전면 취소 (2026-05-29)

> Railway 해외 서버(싱가포르)에서 한국 공공 API WAF 차단 확인. Railway 한국 리전 미지원.
> 관련 모듈(law, safety, car) 및 프론트 페이지 전부 제거 완료. `docs/PUBLIC_API_PLAN.md` 참고.

- [x] ~~Phase 1: 내 차 관리~~ — 제거됨
- [x] ~~Phase 2: 법령 검색~~ — 제거됨
- [x] ~~Phase 3: 사고 다발지점~~ — 제거됨

### P2 — 완성도 향상 (2~3주 내)

- [ ] **GitHub README 스크린샷/아키텍처 다이어그램** — 포트폴리오 첫인상 개선
  - 메인 페이지, 챗봇 데모, 관리자 대시보드 스크린샷
  - 아키텍처 다이어그램 (Mermaid 또는 PNG)

- [ ] **AWS 풀스택 구성** (포트폴리오 심화)
  - CloudFront + S3 / ECS Fargate + ALB / RDS PostgreSQL + pgvector
  - Route 53 + ACM · CloudWatch + X-Ray
  - `docs/DEPLOYMENT_AWS.md` 신설

### P3 — 보류

- ⏸️ **사용자 가치 검증** — 실사용 데이터(Vercel Analytics) 기반으로 검토

---

## 2. 환경 URL

| 환경 | 프론트엔드 | 백엔드 | DB |
|---|---|---|---|
| **Local** | `http://localhost:3000` | `http://localhost:4000` | Local PostgreSQL |
| **Staging** | Vercel Preview (develop 푸시 시 자동) | `https://drivertree-staging.up.railway.app` | Neon `staging` branch |
| **Production** | `https://drivetree.vercel.app` | `https://drivertree-production.up.railway.app` | Neon `main` branch |

---

## 3. 알려진 트러블슈팅 메모

### Prisma 7 (7.8.0)
- `@prisma/adapter-pg` + `pg` + `previewFeatures = ["driverAdapters"]` 사용.
- 의존성 변경 후 반드시 `npx prisma generate`.

### npm 10.x + wasm32 optional 패키지 lock 버그
- 백엔드·프론트엔드 CI 모두 `npm install` 사용 (not `npm ci`). CI workflow 변경 금지.

### 백엔드 prettier 미실행 → CI lint 실패
- 백엔드 소스 수정 후 `cd backend && npm run format` 없이 push 시 CI 실패.

### CI push 트리거 간헐적 비활성화
- develop 브랜치 push 이벤트가 GitHub에 도달해도 Actions가 실행되지 않는 현상 발생.
- 원인 미상 (GitHub 일시적 문제 추정). `workflow_dispatch`로 수동 트리거 가능.
- `gh api repos/grinvi04/drivertree/actions/workflows/282795235/dispatches -X POST -f ref=develop`

### React 19 Compiler 신규 lint 규칙
- `react-hooks/set-state-in-effect`: effect body에서 동기 setState 금지 → async 함수 안으로 이동.
- `useMemo` deps와 본문에서 optional chaining 일치 필수.

### 한국어 정규식
- `\s*` 대신 `.*?` (lazy wildcard). 수식어가 끼면 `\s*`로 미매칭.

### Railway API 직접 호출
- GraphQL endpoint: `https://backboard.railway.app/graphql/v2`
- `Authorization: Bearer <RAILWAY_TOKEN>`
- `me` 쿼리는 실패할 수 있음. `projects` 최상위 쿼리는 동작.

---

## 4. 새 세션 시작 시 입력 템플릿

```
DriveTree 프로젝트 이어서 작업.
먼저 PRD.md, README.md, docs/AI_LOG.md, docs/NEXT_STEPS.md를 읽고 현재 상태 파악해줘.

오늘 작업 목표: [여기에 구체적으로]
  예) "공공 API (도로교통공단) 연동 기능 추가"
  예) "GitHub README 스크린샷 + 아키텍처 다이어그램 추가"
  예) "Sentry DSN 설정 + @sentry/nextjs 프론트 셋업"
  예) "AWS 풀스택 구성 (ECS Fargate + RDS)"
```
