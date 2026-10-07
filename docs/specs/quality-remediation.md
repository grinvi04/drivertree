# 품질 리메디에이션 로드맵 — DriveTree

> 상태: 부분 구현됨; 현재 후보 QA와 Harness 검사 단계 전환 진행. 과거 정적 감사는 당시 기록이며 현재 결함 목록으로 재해석하지 않는다.
> 작성 근거: 자매 프로젝트 erp 품질 감사에서 도출된 결함 클래스 + team-harness 표준.

## §0 Context / Why

### 현재 상태와 QA 계약 (2026-10-07)

기준 소스는 `bd634e62b2902cbd843a2d9bac9766464d06f9b6`이다. 사용자 승인으로 QA/문서 계약 연결과 격리 검증을 진행한다. 운영 배포·main/default 배치·브랜치 보호/이벤트 정책 변경은 별도 범위다.

- T1-1: filter와 단위 회귀가 이미 구현됐다. 현재 시험의 HTTP 응답 증거를 대조하며 새 구현을 반복하지 않는다.
- T2-1: `backend/test/content-chat.integration.e2e-spec.ts`와 CI `test:e2e` 연결이 존재한다. 실DB 실행 전 전체 PASS로 표시하지 않는다.
- T2-2: Content `deletedAt`과 조회 제외·행/임베딩 보존 회귀가 존재한다. 과거 물리삭제 서술은 아래에 보존한다. 벡터 검색은 기존 단언만으로 전수 검증됐다고 주장하지 않는다.
- T2-3: §6의 경량 error-code deviation 결정을 유지한다. 전면 Envelope를 새로 구현하지 않는다.
- T3: 기존 제품 결정·잔여 정책을 유지한다. 이번 연결이 다중 운영자·PII 정책 합의를 만들지 않는다.

| 필수 요구·위험 | 조건과 기대값 / 관찰 경계 | 검사·증거 / 현재 판정 |
|---|---|---|
| 입력 오류와 서버 오류 구분 | malformed 400, oversize 413, plain Error 500; filter 단위와 실제 HTTP 파서 경계를 구분 | backend 단위 70·e2e 17 PASS; 새 실제 HTTP parser 회귀 4개 포함 |
| 데이터 보존·활성 조회 | 실DB CRUD 후 soft-delete; 단건/slug/목록 제외, Content 행·임베딩 보존 | 격리 Postgres의 backend `test:e2e` PASS |
| AI 미사용 폴백 | 키 없이 실DB 콘텐츠를 검색하고 ChatLog 1개 저장; 삭제 콘텐츠는 출처에서 제외 | 출처 ID/slug의 응답·저장 긍정 단언을 보완; 실제 DB PASS, 검색이 빈 배열인 반례 검출 |
| 브라우저 유지 흐름 | 홈·관리자·계산기 기존 기대값; API 대역은 실제 저장/실인증 증거와 분리 | frontend 단위 8·Chromium 20 PASS, 재시도 0; API 대역 관찰 |
| 제품 필수 품질 | backend/frontend format·lint·build·단위·e2e exit 0; skip/미해결 flaky 금지 | 로컬 명령 모두 exit 0; 원격 CI는 NOT_RUN/UNVERIFIED |
| 문서·검사 전환 | 현재 상태/링크와 후보 일치; 기존 commitlint 보존; 새 검사 정상/거부/metadata 경계 유지 | byte parity PASS, 독립 검토 후 검색 단언 보완 재검토 PASS; 원격 활성화 UNVERIFIED |

증거는 이 절에 cwd·명령·후보·최초/최종 결과로 기록한다. 기대값은 §2 AC와 기존 단언이 근거이며 실패 뒤 약화하지 않는다. 추가 공백은 해당 경계만 보완하고 제품 전체 무결함으로 확대하지 않는다.

### 최초 로컬 후보 b5fd437의 실행 증거와 잔여 (2026-10-07)

[실행 원문·명령·지문](harness-qa-contract-evidence.json)은 기준 SHA와 변경 파일 지문으로 후보를 식별한다. Node 22.18.0/npm 11.6.2, `npm ci`로 양쪽 lock을 설치했고 모든 검사는 해당 backend/frontend에서 실행했다. 새 pgvector/pg16 container의 합성 DB를 `127.0.0.1:55439`에만 노출하고 Gemini/Sentry 키를 비워 운영 외부 호출을 차단했다. DB 정리 시험은 `--runInBand`로 실행했다.

최초 로컬 품질 명령은 모두 exit 0이었다. 독립 검토에서 기존 검색 단언 공백을 찾아 활성 출처 ID/slug가 응답과 ChatLog에 존재하는 긍정 단언을 보완했다. 검색 결과를 빈 배열로 만드는 안전한 일시 반례에서 새 단언이 exit 1로 검출했고 원본 runtime bytes 복구 후 전체 backend e2e를 다시 확인했다. 이는 실제 장애 재현이 아니라 검사 검출력 확인이다. 제품 runtime·schema·lock은 변경하지 않았다.

**보안 잔여:** npm audit exit 1. backend 전체 28(critical 1/high 15), 운영 의존성 19(critical 1/high 9); frontend 전체 20(critical 1/high 13), 운영 의존성 9(critical 1/high 5). critical 보고 자산은 backend `proxy-addr`, frontend `next`다. 실제 악용 가능성은 이 감사로 확정하지 않는다. 의존성 수정은 이번 QA 계약 변경과 분리하고 배포 전 영향·수정 후보·회귀 검증을 확인한다. 전체 보안/배포 준비는 FAIL이며 기능 검사 PASS로 덮지 않는다.

현재는 로컬 기능/품질 검증과 자산 준비 단계다. 원격 CI/병합/target 활성화/배포는 미실행이며 전체 채택 완료가 아니다. 독립 재검토에서 새 P1/P2 finding 없음으로 확인했다. 다음은 변경 후보 전달, 배포 영향 승인, 기존 보호를 보존하는 실제 원격 전환이다.

### 네 소비 보강 승인 후 의존성 보완 (2026-10-07)

사용자 승인 후 `proxy-addr` 2.0.8과 `next`/`eslint-config-next` 16.3.6의 공식 수정 범위를 확인했다. 기존 manifest의 호환 범위 안에서 취약 transitive 의존성을 갱신했다. 증분 잠금 갱신 뒤 `npm ci`의 optional wasm 의존성 EUSAGE가 발생해 당시 실패를 보존하고, 빈 scratch에 manifest만 넣어 잠금 파일을 재생성했다. 양쪽 최종 `npm ci` PASS이며 테스트/skip/설치 기준을 약화하지 않았다.

수정 후보에서 양쪽 format/lint/build·backend 단위 70/실DB e2e 17·frontend 단위 8/Chromium 20(재시도 0)을 다시 통과했다. 실제 proxy subnet의 허용/거부 경계도 확인했다. 제품 runtime/schema는 변경하지 않았다. source/audit/명령/candidate 지문은 실행 근거 JSON의 `securityFollowup`에 연결한다.

**이전 감사 (Swagger YAML 수정 전):** backend 전체 25(moderate 21/high 4/critical 0), 운영 6(moderate 2/high 4/critical 0); frontend 전체 high 5/critical 0, 운영 0. 이전 critical 경고는 해소됐지만 전체 의존성 감사는 여전히 FAIL이다. backend Prisma 전이의 deepmerge-ts/mysql2 등과 Swagger YAML, frontend 개발 도구의 braces 전이는 잔여다. 감사의 Prisma major 다운그레이드/강제 수정을 적용하지 않는다. 샘플의 local braces patch를 이 제품에 자동 복사하지 않는다. 실제 악용 가능성과 별도 주요 버전/보완 채택은 추가 호환성·범위 검토가 필요하다.

#### Swagger YAML 전이 보완의 QA 계약 (현 후보 실행 전)

이번 범위는 `@nestjs/swagger` 11.4.7의 고정 `js-yaml` 5.3.0만 공식 수정판 5.4.3으로 교체한다. 이 제품의 Swagger 경로는 문서를 YAML로 **직렬화**하며 임의 YAML 업로드·파싱 API는 확인되지 않았다. 그러므로 취약한 파서 반례와 실제 Swagger 문서 소비 경로를 구분해 검증한다. 다른 Prisma 전이·프런트엔드 보안 잔여는 이 수정의 범위가 아니다.

| 요구·위험 / 선정 이유 | 입력·환경 | 기대 결과 / 관찰 경계 | 필수 | 증거·판정 |
|---|---|---|---|---|
| GHSA-r3ph-w7gj-g6xm / 빈 mapping merge가 `maxTotalMergeKeys` 예산을 세지 않아 CPU를 소모 | Swagger가 실제 resolve한 `js-yaml`에 YAML11 빈 mapping merge 배열 5개와 예산 2 | 취약 5.3.0은 허용하는 RED; 수정판은 `maxTotalMergeKeys` 예외로 거부. 작은 합성 입력만 사용 | 필수 | 새 Swagger YAML 회귀의 RED→GREEN 원문 |
| OpenAPI 문서 유지 / 라이브러리 강제 교체가 Swagger YAML 출력을 깨뜨릴 수 있음 | DB·외부 호출 없는 최소 Nest 앱에서 `SwaggerModule.createDocument`·`setup('api/docs')` | JSON·YAML 문서 endpoint 200, YAML을 Swagger resolve parser로 읽은 구조가 JSON과 동일하고 기존 앱 경로를 포함 | 필수 | 같은 e2e 회귀; 정상 문서 결과만 입증 |
| 의존성 범위·제품 품질 | `npm ci`로 lock을 깨끗이 설치, Swagger 내부 resolve 버전과 backend format/lint/build/unit/e2e·실DB 경계 | Swagger만 5.4.3 resolve, 정상 전체 품질 exit 0, 실제 격리 DB 유지 | 필수 | 아래 로컬 PASS와 후보·명령·cwd·exit·소스 지문·원문 로그 연결; 원격 미확인 |

**로컬 검증 결과 (2026-10-07):** [공식 GHSA-r3ph-w7gj-g6xm](https://github.com/advisories/GHSA-r3ph-w7gj-g6xm)의 최소 수정판은 5.4.1이고, 이 후보는 Swagger 11.4.7에만 `js-yaml` 5.4.3 override를 건다. 실제 Swagger 모듈이 resolve한 버전은 5.4.3이며 루트 4.3.2 등 다른 경로는 유지됐다. 새 `swagger-yaml.e2e-spec.ts`에서 취약 5.3.0의 예산 초과 입력은 거부 단언을 통과하지 못했고(RED), 5.4.3에서는 예외로 거부됐다(GREEN). 같은 시험에서 `SwaggerModule.createDocument`·`setup('api/docs')`의 JSON/YAML 엔드포인트가 200이며 두 문서의 파싱 결과가 같고 `/api` 경로를 포함함을 확인했다. 실제 앱은 Swagger YAML을 직렬화하며 외부 YAML을 파싱하는 API는 확인되지 않았다. 이 시험은 의존성 파서의 반례 차단과 기존 문서 경로의 호환성을 각각 입증한다.

첫 증분 잠금파일 갱신은 선택적 `@emnapi` 항목이 빠져 `npm ci`가 EUSAGE로 실패했다. 빈 디렉터리에서 동일 `package.json`으로 잠금파일을 재생성하자 원래 lock 대비 Swagger YAML 세 값(version/resolved/integrity)만 바뀌었고, 그 파일로 `npm ci`가 통과했다. backend format/lint/build·단위 70·실DB e2e 19(새 2 포함)도 통과했다. 실DB는 기존 합성 전용 pgvector fixture의 127.0.0.1:55439 노출을 검사하고 실행 후 중지했다. 감사는 전체 24(moderate 20/high 4), 운영 4(high 4)로 각각 exit 1이며 남은 Prisma 전이 등은 이 후보에서 미수정이다. 전체 감사의 `js-yaml` moderate는 Jest 개발 전이 `@istanbuljs/load-nyc-config`의 3.15.2에 대한 `argparse` 경고이고 운영 감사에는 없다. [실행 원문·지문](harness-qa-contract-evidence.json)의 `swaggerYamlFollowup`에 각 후보·명령·실패·종료 상태를 연결한다. 원격 CI·PR·병합·배포는 미실행/UNVERIFIED다.

독립 의존성 후보 검토 진행 중이다. 원격 CI/병합·default branch 배치·필수 검사 전환·staging/production 배포는 여전히 NOT_RUN/UNVERIFIED다. 로컬 기능 품질 PASS와 전체 보안/배포 FAIL을 구분한다.

### 신뢰 커밋 검사 전환 — 준비와 활성화 분리

`.github/workflows/commitlint-trusted.yml`을 Harness v0.81.0 정본에서 추가한다. 기존 workflow와 필수 `commitlint`는 유지한다. develop 파일 존재나 최초 PR의 기존 CI green은 새 target 검사 활성화 증거가 아니다.

다음은 별도 승인된 main/default 배치 → 후속 실제 PR의 같은 HEAD에서 새 검사 PASS → 새 required context 추가/readback → 기존 context 제거 순이다. 다른 검사·앱 binding·strict·승인·관리자·force-push/삭제 보호를 보존한다. 새 정본 파일을 감지하는 로컬 repo-sync는 18/18 PASS다. 이는 자산 정합성이고 원격 이벤트/필수 검사 활성화는 여전히 UNVERIFIED다. checker를 약화하거나 성공 상태를 수동 게시하지 않는다. develop 병합은 Railway staging 자동 배포와 연결되므로 검증 완료와 배포 승인을 분리한다.

원본: [Harness 전환 계약](https://github.com/grinvi04/team-harness/blob/9838c2ef288b4566f81fae03acb56530ee165c06/docs/specs/trusted-commitlint.md). 전체 소비 적용: [Harness #496](https://github.com/grinvi04/team-harness/issues/496).

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
