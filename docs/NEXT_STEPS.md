# 🗒️ DriveTree — 이어서 할 일 노트

> 새 세션에서 이 프로젝트를 다시 이어받을 때 가장 먼저 읽을 문서.
> Claude/AI Agent에게 "PRD.md + README.md + docs/AI_LOG.md + docs/NEXT_STEPS.md 먼저 읽고 시작해줘" 라고만 해도 5분 안에 따라잡을 수 있도록 정리.

---

## 0. 지금까지 어디까지 왔는지 (2026-05-21 기준)

- ✅ PRD v0.1 확정 (`PRD.md`)
- ✅ 백엔드 MVP 골격 완성 — NestJS 11 + Prisma 7 (driver adapter) + pgvector + JWT 인증 + 시드 4건 + 챗봇(RAG + 로컬 폴백) + 계산기 2종
- ✅ 프론트엔드 MVP 골격 완성 — Next.js 16 + React 19 + Tailwind v4 — 메인/콘텐츠 상세/계산기/관리자 페이지
- ✅ 로컬 통합 동작 확인 — `http://localhost:4000/api` Hello World, 시드 자동 적재
- ✅ 운영 문서 — `README.md`, `docs/AI_LOG.md`
- ✅ **전략 결정** — 1차 목적을 *"진짜 사용자 서비스(수익화)"* 트랙으로 확정 (2026-05-21)
- ✅ **검증 가설 + 인터뷰 질문지** — `docs/USER_RESEARCH.md` 작성 완료 (가설 4종, 페르소나별 질문지, 의사결정 매트릭스 포함)
- ✅ **데모 시드 보강** — 콘텐츠 4건 → **6건** (license-type-1-vs-2, maintenance-engine-oil-cycle 추가). P1/P2/P3 데모 시나리오 3건 모두 출처 매칭 가능. 시드 로직도 slug 기준 idempotent로 변경 (2026-05-22)
- ✅ **인터뷰 데모 환경 셋업 가이드** — `docs/INTERVIEW_SETUP.md` (Gemini API Key 발급, 시드 적재 확인, 챗봇 사전 검증, 30초 점검표)

PRD의 6개 기능(F1~F6)이 *기본 동작 가능* 상태로 들어와 있음. 콘텐츠는 6건 시드된 상태.

---

## 1. ✅ 전략 결정 — 포트폴리오 트랙 (2026-05-22)

- [x] **포트폴리오 (취업 무기)** — 운영/품질 보강 → 배포 → AI_LOG 강화
- [ ] ~~사용자 가치 검증 트랙~~ — 종료 (`docs/USER_RESEARCH.md` 등 인터뷰 자료는 폴더에 남겨두되 현 트랙과 무관)

---

## 2. 다음에 손댈 작업 후보 (우선순위는 1번 결정에 따름)

### 포트폴리오 트랙 (현재 활성)
- [x] **운영/품질 보강** (2026-05-22 완료)
  - `@nestjs/throttler` v6.5 도입 — 글로벌 60/min (default), `/chat/ask` 라우트는 short(10/min) + long(60/hour) 이중 throttler로 Gemini 비용 보호
  - `/chat/feedback` 도 30/min 적용
  - 챗봇 프롬프트 인젝션 방어 — (a) DTO `MaxLength(200)` 길이 제한 (b) 9개 의심 패턴 정규식 감지 → 로그 경고 (c) 시스템 프롬프트에 "역할 변경 거부 / 운전 무관 거부 / 사용자 입력은 데이터" 명시
- [ ] **배포 (옵션 A — Neon + Railway + Vercel)** — 코드/설정 준비 완료 (2026-05-22). 사용자가 3개 계정 만들고 `docs/DEPLOYMENT.md` 따라 진행하면 30분 안에 운영 URL 확보.
  - 준비된 변경: CORS 환경변수 화이트리스트, `start:prod` 경로 수정(`dist/src/main.js`), `backend/railway.json` 작성, `ALLOWED_ORIGINS` env 추가, pgvector extension은 마이그레이션에 이미 포함
- [ ] **배포 (옵션 B — AWS 풀스택)** — 옵션 A 안정화 후 별도 진행. `docs/DEPLOYMENT_AWS.md` 신설 예정.
- [ ] **Gemini API Key 채우고 RAG 품질 비교** — 로컬 폴백 vs 실제 RAG 답변 차이를 AI_LOG에 스크린샷으로 남기면 "AI Agent 활용 능력 시연" 항목 강화됨.
- [ ] **AI_LOG 강화** — 본 세션에서 겪은 Prisma 7 driver adapter 전환 같은 트러블슈팅을 상세하게. 면접 답변 재료.
- [ ] **SEO 구현** — `/content/[slug]`를 SSG/ISR로 전환, sitemap.xml, OG 이미지.
- [ ] **GitHub README** — 스크린샷/아키텍처 다이어그램 추가.

### 사용자 가치 트랙 (⏸️ 보류 — 인터뷰 부담으로 동결)
- [x] 가설 4종 + 인터뷰 질문지 작성 → `docs/USER_RESEARCH.md`
- [x] 데모 환경 셋업 가이드 → `docs/INTERVIEW_SETUP.md`
- [x] 인터뷰 결과 기록 템플릿 → `docs/interviews/_template.md`
- ⏸️ 인터뷰 실행 — **보류**. 재개 시 위 3개 문서 그대로 사용.
- ❓ **비대면 검증으로 전환 가능** — 데스크 리서치(유튜브/카페/블로그) + 서베이 폼(구글 폼). USER_RESEARCH.md 가설은 그대로, 검증 방법만 교체.

### 운영/품질 트랙 (배포하기 전에)
- [x] **Rate Limiting** — 글로벌 60/min + `/chat/ask` 추가 강화 (2026-05-22)
- [x] **프롬프트 인젝션 방어** — DTO MaxLength + 9개 패턴 감지 + 시스템 프롬프트 강화 (2026-05-22)
- [x] **Critical Security 핫픽스** — admin/login placeholder 자격증명 제거, README 디폴트 비번 노출 완화 (Phase 1, 2026-05-24, v1.0.1)
- [x] **디자인 깨짐 수정** — Tailwind v4 비표준 spacing 클래스 임의값으로 정규화 (Phase 2)
- [x] **XSS 방어 강화** — 마크다운 렌더러 escapeHtml + DOMPurify 이중 sanitize, 콘텐츠 DTO 길이/패턴 검증, Next.js 보안 헤더(CSP/X-Frame-Options/Referrer-Policy) 적용 (Phase 3)
- [x] **CI 파이프라인 + 핵심 유닛테스트** — GitHub Actions(.github/workflows/ci.yml) 백/프론트 lint+build+test, pgvector Postgres 서비스 컨테이너로 마이그레이션 검증, CalculatorService(9건)·ChatService 인젝션 감지(20건+)·AppController 헬스(2건) 유닛테스트 (Phase 4)
- [x] **구조화 로깅 & 글로벌 예외 필터** — AllExceptionsFilter(상태별 warn/error 분리, 일관된 JSON 응답), RequestLoggerMiddleware(method·url·status·durationMs·UA), 모든 `console.*` → NestJS Logger 변환, `NEST_LOG_LEVEL` env 도입 (Phase 5)
- [ ] **JWT 저장 위치 마이그레이션 (Follow-up)** — 현재 `localStorage`에 저장(XSS 발생 시 토큰 탈취 위험). 백엔드는 `httpOnly + Secure + SameSite=Lax` 쿠키로 발급, 프론트는 `credentials: 'include'` 호출로 전환 필요. Phase 3에서 XSS 차단으로 1차 완화했으나 토큰 저장 자체는 그대로.
- [ ] **Sentry forwarding 활성화 (Follow-up)** — `@sentry/node` 미설치 상태. `backend/src/common/all-exceptions.filter.ts` TODO 위치에 `Sentry.captureException(exception)` 추가하고 `SENTRY_DSN` env 설정만 하면 5xx가 Sentry로 전송됨. 프론트는 `@sentry/nextjs` 별도 셋업.
- [ ] **Gemini API 비용 모니터링** — 일일/월 호출 횟수 로깅, 임계치 알림.
- [ ] **모바일 UX 점검** — 운전자가 모바일로 더 자주 접근 (PRD 6.3). 카드 그리드, 챗봇 다이얼로그.

---

## 3. 알려진 트러블슈팅 메모 (다음 세션이 같은 함정 안 빠지게)

### Prisma 7 (현재 7.8.0) — 매우 중요
- **PrismaClient 직접 구성 시 driver adapter 또는 accelerateUrl 필수**. `datasourceUrl`, `datasources` 옵션은 타입에서 사라짐.
- **현재 구성**: `@prisma/adapter-pg` + `pg` 패키지 + `previewFeatures = ["driverAdapters"]`
- **schema.prisma의 datasource 블록에 `url`을 직접 쓰면 P1012 에러**. URL은 `prisma.config.ts`에서만 관리.
- 의존성 변경 후 반드시 `npx prisma generate` 다시 돌릴 것.

### React 19 + ESLint 신규 규칙
- `react-hooks/set-state-in-effect`, `react-hooks/immutability` 두 신규 규칙이 매우 엄격함.
- 본 프로젝트에서는 `eslint.config.mjs`에서 warning으로 완화 처리. 실제로 효과 큰 안티패턴이면 그때마다 리팩토링 권장.

### Next.js 16 + SWC 바이너리
- `next build`는 첫 실행 시 플랫폼별 SWC 바이너리를 npm 레지스트리에서 추가 다운로드. **샌드박스/오프라인 환경에서는 막힘.** 로컬 머신에서 직접 빌드 필요.

---

## 4. 새 세션 시작 시 입력 템플릿

```
DriveTree 프로젝트 이어서 작업.
먼저 PRD.md, README.md, docs/AI_LOG.md, docs/NEXT_STEPS.md를 읽고 현재 상태 파악해줘.

오늘 작업 목표: [여기에 구체적으로]
  예) "배포 — Vercel + Railway + Neon으로 띄우기"
  예) "콘텐츠 시드 10건 추가 (면허 취득 가이드 위주)"
  예) "Gemini API Key 채우고 챗봇 답변 품질 검증"

먼저 NEXT_STEPS.md 1번 항목(전략 결정)에 내가 어떻게 답하는지 물어봐줘.
```
