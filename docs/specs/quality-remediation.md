# 품질 리메디에이션 로드맵 — DriveTree

> 상태: 제안(미착수). 머지 전 사용자 합의 필요.
> 작성 근거: 자매 프로젝트 erp 품질 감사에서 도출된 결함 클래스 + team-harness 표준.

## §0 Context / Why

자매 프로젝트 **erp**에서 실 스택 감사로 다수 결함을 찾아 **team-harness 표준**(`api-standards.md`·`db-standards.md`·`code-review.md`)에 메커니즘으로 박았다. DriveTree(NestJS 11 + Prisma 7 + pgvector RAG / Next.js 15)도 **같은 클래스 문제**가 있을 가능성이 높아 동일 기준으로 점검했다.

- **점검 방식**: 전 소스 **정독 기반(static)**. **앱·DB 미기동** — 런타임 실측이 아닌 항목은 인벤토리에 명시한다.
- **범위**: erp-클래스 9종(입력 4xx/5xx·소프트삭제·테스트 깊이·하드삭제·식별자 노출·낙관적잠금·페이지네이션 크래시·마이그레이션 운영안전·타입 안전).
- **성공 기준**: 본 로드맵의 Tier1·Tier2 AC를 충족하는 테스트가 CI에서 GREEN이고, 신규 동종 부채는 harness-guard 게이트가 차단한다.

**전반 평가**: erp 대비 방어가 잘 된 코드베이스다(`sanitize-html`·throttle·refresh 토큰 회전·`: any` 0건·DTO 검증 촘촘). 핵심 갭은 **① body-parser 단계 4xx→5xx 흡수**와 **② 통합 테스트 부재(실DB 미검증)** 두 가지가 erp와 동일 클래스로 재현된다.

**마이그레이션 클래스는 깨끗**: 마이그레이션 2개 모두 **타임스탬프 네이밍**(`20260520163143_init`, `20260526091157_…`)이라 구조적 out-of-order가 불가하고, 운영 경로는 `railway.json` startCommand의 `prisma migrate deploy`(forward-only). team-harness 마이그레이션 안전성 게이트 결과도 `skip(대상 없음)` exit 0. 본 로드맵에 마이그레이션 작업은 없다.

---

## §1 결함 인벤토리 (Tier순)

### Tier 1 — High (운영 알람 오염, 즉시 처리)

| # | 클래스 | 위치 (file:line) | 결함 | team-harness 표준 |
|---|---|---|---|---|
| T1-1 | 입력오류 4xx→5xx 흡수 | `backend/src/common/all-exceptions.filter.ts:23-24` | 비-HttpException은 무조건 500. body-parser의 **malformed JSON(SyntaxError, status 400)**·**PayloadTooLarge(413)** 가 `err.status`를 무시당하고 500으로 흡수. **`/chat/ask`는 공개 + JSON body** → 임의 클라이언트의 깨진 JSON이 500 + Sentry 캡처 → on-call 알람·에러지표 오염 (정독 추론, 런타임 미검증) | `api-standards.md` "클라이언트 입력 오류는 4xx로 — 5xx 흡수 금지" |

### Tier 2 — Med (구조적 부채)

| # | 클래스 | 위치 (file:line) | 결함 | team-harness 표준 |
|---|---|---|---|---|
| T2-1 | 테스트 깊이 | `backend/src/**/*.spec.ts`(예: `content/content.service.spec.ts:24-48`), `.github/workflows/ci.yml:88` | 백엔드 단위 테스트가 **전부 PrismaService를 mock**. CI가 Postgres를 띄우고 `migrate deploy`까지 하지만 `npm test`는 DB 미접촉 → pgvector 검색·`$queryRaw`·트랜잭션·삭제 동작 미검증. 백엔드 e2e(`test/*.e2e-spec.ts`)는 **CI 미연결**(`test:e2e` 스텝 없음), 그나마 DB 미접촉(app·calculator만) | `code-review.md` §"테스트 깊이 — 렌더 스모크 ≠ 기능 테스트" |
| T2-2 | 하드삭제 + 소프트삭제/audit 부재 | `backend/src/content/content.service.ts:262-267`, `backend/prisma/schema.prisma` | `content.delete()` **물리 삭제** + FK `onDelete: Cascade`로 임베딩 동반 삭제 → 이력 소실. 4개 모델 모두 `deletedAt`·`is_active`·`version` 없음 | `db-standards.md` §삭제 정책(마스터는 `is_active`, 전표는 soft delete) |
| T2-3 | 공통 Envelope·에러코드 미적용 | `backend/src/common/all-exceptions.filter.ts:50-55`, `frontend/src/lib/api.ts`(error 파싱) | 에러 응답이 `{statusCode,timestamp,path,message}`로 표준 `{code,message,data}`와 불일치, **`code` 없음** → 프론트가 표준이 금지한 `message` 문자열로 분기 | `api-standards.md` §공통 응답 Envelope / 에러 코드 체계 |

### Tier 3 — Low (현 규모 수용 가능, 의식적 deviation 후보)

| # | 클래스 | 위치 (file:line) | 결함 | team-harness 표준 |
|---|---|---|---|---|
| T3-1 | 낙관적잠금/동시성 | `backend/src/content/content.service.ts:243-260` | `version` 없음. `update`가 read-then-write → 동시 수정 시 last-write-wins. **단일 admin 운영이라 실위험 낮음** | `db-standards.md` 공통 컬럼 `version` / `api-standards.md` 낙관적 잠금 |
| T3-2 | 식별자 노출 | `backend/src/content/content.dto.ts:408`, `/content/:id` 라우트 | UUID PK를 응답·URL에 노출. 단 **UUID는 비열거형**이고 공개 식별자는 `slug` → 실질 위험 낮음 | `db-standards.md` §기본키(외부 노출은 채번 코드) |
| T3-3 | 챗 로그 PII 보존정책 | `backend/src/chat/chat.service.ts:139-141, 198-205` | 인젝션 의심 시 사용자 메시지 80자 warn 로그 기록, ChatLog 원문 무기한 저장(보존정책 없음) | `operations.md` 로그 마스킹 / 보존 |

### erp-클래스 중 "깨끗"으로 확인 (실측)

- **마이그레이션 운영안전**: 타임스탬프 네이밍 + `migrate deploy` + forward-only → out-of-order/드리프트 없음.
- **소프트삭제 누출(Prisma 미들웨어 누락)**: soft-delete 메커니즘 **자체가 없어** 삭제 레코드 누출 클래스는 해당 없음(부채는 T2-2의 "부재" 쪽).
- **페이지네이션 크래시/죽은 컨트롤**: 프론트가 `result.data`/`result.meta`로 정확히 소비(`frontend/src/app/page.tsx:37-38`, `admin/dashboard/page.tsx:73-74`), 배열 가정 없음. 버튼·`disabled` 경계 정상. PenaltyRule 필드 백/프론트 완전 일치.
- **XSS**: 콘텐츠 마크다운 `escapeHtml` + `sanitize-html`(`content/[slug]/page.tsx:60,279,347`), 챗봇 응답 React 텍스트 렌더 → 안전.
- **타입 안전**: 백엔드 `src`에 `: any`/`as any` 0건, DTO 검증 촘촘.
- **입력검증 정상 경로**: 전역 `ValidationPipe`(whitelist+transform) → DTO 위반 400. (T1-1은 DTO **도달 전** body-parser 단계만 해당.)

---

## §2 수용 기준 (AC)

### T1-1 — 입력 4xx
- `POST /api/chat/ask`에 **깨진 JSON 바디** → **400** + (도입 시) Envelope, **500 아님**.
- 본문 크기 한도 초과 → **413**, 500 아님.
- AllExceptionsFilter 단위 테스트: 비-HttpException이라도 `err.status`/`err.statusCode`가 4xx면 그 코드로 매핑, 5xx만 서버오류로 처리.

### T2-1 — 테스트 깊이
- **핵심 흐름 실DB 통합 테스트 1개 이상** CI GREEN: Content 생성→조회→삭제, 또는 chat ask 경로(임베딩 없는 로컬 폴백 포함)가 **실 Postgres**에서 끝까지 도는지 단언.
- 백엔드 e2e가 CI 게이트에 **연결**(`test:e2e` 스텝 추가, 실DB env).

### T2-2 — 하드삭제 → soft-disable
- Content에 `is_active`(또는 `deletedAt`) 도입, `remove()`가 물리삭제 대신 비활성화.
- **비활성 콘텐츠가 공개 목록/단건/검색·임베딩 검색에서 제외**되는지 단언하는 테스트(실DB).
- 임베딩 cascade 물리삭제로 인한 이력 소실이 발생하지 않음.

### T2-3 — Envelope
- 성공/실패 응답이 `{code,message,data}` 형태(전역 인터셉터 + 필터 한 곳).
- 에러에 `SCREAMING_SNAKE` `code` 부여, 프론트가 `code`로 분기(message는 표시용).
- 단, §6 합의에 따라 **의식적 deviation으로 유지**할 수 있음(그 경우 AC는 "결정을 `docs/decisions` 또는 본 문서에 기록").

### T3-1~3
- T3-1: 다중 운영자 도입 시점에 `version` + 조건부 update(현재는 보류 가능).
- T3-2: 현 규모 수용, 결정 기록.
- T3-3: 로그 마스킹 + ChatLog 보존기간 정책 합의.

---

## §3 PR 분해 (작고 응집적, 순서·의존)

| 순서 | PR | 범위 | 의존 |
|---|---|---|---|
| 1 | `fix(api): body-parser 입력오류 4xx 매핑` | AllExceptionsFilter가 비-HttpException `.status` 4xx 존중 + 단위테스트(T1-1) | 없음 (독립, 최우선) |
| 2 | `test(backend): 실DB 통합 테스트 + e2e CI 연결` | 핵심 흐름 통합 테스트 1+, `test:e2e` CI 스텝(T2-1) | 없음 (독립) — 이후 PR의 회귀 안전망 |
| 3 | `feat(content): 하드삭제 → soft-disable` | `is_active` 마이그레이션 + 쿼리 필터 + 제외 테스트(T2-2) | PR#2 권장(통합테스트로 제외 단언) |
| 4 | `feat(api): 공통 Envelope·에러코드` | 인터셉터+필터+프론트 `code` 분기(T2-3) — **§6 합의 후** | PR#1(필터 수정 충돌 회피 위해 #1 머지 후) |

- T3는 별도 후속(스코프 외) — 본 로드맵은 Tier1·Tier2 우선.
- 각 PR은 RED 테스트로 결함 박제 후 GREEN(`code-review.md` §"수정 전 실패 테스트").

---

## §4 검증 전략 (NestJS 기준)

- **T1-1**: AllExceptionsFilter를 직접 인스턴스화해 `ArgumentsHost` mock으로 `status`-속성 `Error` 주입 → 매핑 단언(단위). + supertest로 깨진 JSON·과대 바디 e2e 단언.
- **T2-1**: `Test.createTestingModule`에 **실 PrismaService**(CI Postgres, `DATABASE_URL`) 주입한 통합 spec. jest 단위(mock)와 분리된 e2e 프로젝트(`test/jest-e2e.json`)로 두고 `test:e2e`를 CI에 추가.
- **T2-2**: 실DB e2e에서 생성→soft-disable→공개 목록/검색에서 제외 단언. ValidationPipe·필터는 e2e 부트스트랩에서 `main.ts`와 동일 구성(`useGlobalPipes`/`useGlobalFilters`)으로 맞춰 운영과 동치.
- **T2-3**: 인터셉터 단위 + 대표 엔드포인트 응답 스키마 e2e 단언.
- CI: 기존 Postgres 서비스 재사용, 단위(mock)·통합(실DB)·e2e 잡 분리.

---

## §5 Do-Not (잘 된 방어를 깨지 말 것)

- `sanitize-html` + `escapeHtml` 마크다운 파이프라인, 챗봇 React 텍스트 렌더링 **유지** — XSS 방어 회귀 금지.
- `@nestjs/throttler` rate-limit(`/chat/ask` short/long) **유지**.
- refresh 토큰 **회전 + bcrypt 해시 저장 + httpOnly/secure/sameSite 쿠키** **유지**.
- `: any` 0건·DTO class-validator 엄격성 **유지** — 느슨하게 풀지 말 것.
- **단일 admin·단일 테넌트 제품 특성 존중**: 멀티테넌시·RBAC·낙관적잠금을 제품이 요구하지 않는데 erp 전제로 강제 도입하지 말 것. 과설계 금지.
- 정독 기반 결함(T1-1)은 **수정 전 실패 테스트로 재현**부터 — 추측 수정 금지.

---

## §6 Open Questions (사용자 합의 필요)

1. **Envelope(T2-3)**: 단일 제품이라 표준 `{code,message,data}`를 전면 도입할지, 아니면 **의식적 deviation**으로 두고 결정만 기록할지? (프론트 `message` 분기 1곳만 정리하는 경량안도 가능)
   - **결정(2026-06-28)**: 단일제품 — **경량 `code` 필드 deviation 채택**. 성공 응답 구조는 불변, 에러 응답에만 SCREAMING_SNAKE `code`를 추가(`all-exceptions.filter.ts`)하고 프론트 `ApiError`가 `code`를 보존해 분기는 `code`/`statusCode`로(표시는 `message`). 전면 `{code,message,data}` 전환은 보류.
2. **식별자 노출(T3-2)**: UUID 비열거형 + slug 공개키로 충분 — **수용(deviation)** 으로 종결할지?
3. **소프트삭제 방식(T2-2)**: Content를 `is_active` 비활성화(마스터 관점)로 갈지, `deletedAt` soft-delete로 갈지? 임베딩 재인덱싱 정책은?
4. **낙관적잠금(T3-1)**: 다중 운영자 계획이 있는가? 없으면 보류 확정.
5. **로그/PII(T3-3)**: ChatLog 보존기간·마스킹 정책 기준?

---

> 신규 부채는 harness-guard v0.7.0 게이트(release-check·pr-review-gate)가 차단 — 이 문서는 **기존 부채 정리용**이다.
