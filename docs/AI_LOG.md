# 🤖 AI 활용 로그 (DriveTree)

DriveTree 개발 전 과정에서 AI 협업이 어떻게 사용되었는지 기록한다.

## 1. 활용 모델 / 도구

| 단계 | 사용 도구 | 용도 |
|---|---|---|
| 기획 | Claude (대화형) | 페르소나·MVP·카테고리 구조 발산 → PRD v0.1 정리 |
| 백엔드 코드 | Claude Code (Antigravity → Claude 이관) | NestJS 모듈/서비스 스캐폴딩, Prisma 스키마 작성, pgvector 쿼리 작성 |
| 프론트 코드 | 동일 Agent | Next.js App Router 페이지, Tailwind v4 디자인 시스템, 마크다운 렌더러 |
| 콘텐츠 시드 | AI 초안 + 사람 검수 | 시드 가이드 6건 초안 → 법규 정확성 사람 검수 |
| 챗봇 (런타임) | 자체 구현 TF-IDF + 코사인 유사도 | 사용자 질의 → pgvector 벡터 검색 → 답변 생성 |

## 2. 분담 원칙

- **AI가 한 일**: 보일러플레이트 코드, 디자인 토큰 제안, 한국어 톤의 카피라이팅 초안, 카테고리/태그 정규화.
- **사람이 한 일**: PRD 의사결정, 법규 정확성 검증, 데이터 모델/도메인 결정, 보안 정책 (JWT secret, CORS, Rate limit 정책 결정).

## 3. 챗봇 설계 결정

1. **벡터 DB**: Pinecone/Qdrant 대신 **pgvector**를 선택 — 인프라 1개로 끝나는 단순성과, Prisma `Unsupported("vector(768)")` 타입으로 그대로 모델링 가능.
2. **차원수 768**: 추후 임베딩 모델 교체 시 마이그레이션 1줄로 변경 가능하도록 설계.
3. **거리 임계치 0.6**: 코사인 거리 기준. 한국어 짧은 질문에서 노이즈가 너무 많이 섞이지 않도록 보수적으로 설정.
4. **청크 사이즈 500자**: 한국어 문장 단위로 자연 분절.
5. **로컬 NLP**: 외부 API 의존 없이 항상 동작 — TF-IDF + 코사인 유사도 헬퍼 (`common/local-nlp.helper.ts`). 한국어 조사 stopword 처리 포함.

## 4. 작업 인계 메모 (초기 환경 구성)

본 프로젝트는 외부 Agent(Antigravity)에서 시작되어 사용량 한도로 작업이 중단된 후 Claude Code 환경에서 이어받았다. 인계 시 다음을 점검했다.

- Prisma 7.x에서 `datasourceUrl` 옵션이 제거되어 `PrismaService` 수정 (env DATABASE_URL 자동 로딩으로 변경).
- React 19 신규 hooks 규칙(`react-hooks/set-state-in-effect`, `react-hooks/immutability`)이 매우 엄격해 ESLint에서 warning 처리.
- `any` 타입과 deprecated `String.prototype.substr` 제거.

## 5. CI/CD 안정화 작업 (2026-05-25)

v1.1.0 quality sprint 이후 GitHub Actions CI가 연속 실패. 5건 순차 수정.

| # | 증상 | 원인 | 해결 |
|---|---|---|---|
| 1 | 백엔드 lint 80+ prettier 에러 | 코드 변경 후 `npm run format` 미실행 | `npm run format` 일괄 실행 |
| 2 | 프론트 `npm ci` EUSAGE | npm 10.x + wasm32-only optional 패키지 lock 파일 불일치 | CI workflow를 `npm install`로 변경 |
| 3 | 백엔드 TS 빌드 TS2322 | `item.slug`가 `string \| undefined`인데 `MatchedSource.slug`는 `string` | `slug: item.slug ?? ''` |
| 4 | 프론트 ESLint error | `useMemo` 본문과 deps에서 optional chaining 불일치 | 본문을 `post?.content`로 통일 |
| 5 | 백엔드 유닛 테스트 1건 실패 | 인젝션 감지 regex `\s*`가 중간 단어 허용 못 함 | `\s*` → `.*?` (lazy wildcard) |

## 6. v1.4.0 품질 스프린트 (2026-05-26~27)

5개 스프린트로 코드베이스를 실서비스 수준으로 격상.

### S1 — API 품질 (페이지네이션 · Swagger · DTO)
- 콘텐츠 목록에 `PaginatedResult<T>` 제네릭 반환 타입 + 페이지네이션 도입.
- Swagger 전 엔드포인트 문서화. `/api/docs`에서 인터랙티브 확인 가능.
- 시드 파일을 `prisma/seed.ts`로 분리.

### S2 — JWT httpOnly 쿠키 + Refresh Token
- Access Token 15분 / Refresh Token 7일 이중 토큰 구조.
- 두 토큰 모두 httpOnly Cookie → XSS 토큰 탈취 차단.
- Refresh Token bcrypt 해시 DB 저장 → 서버측 무효화 가능.
- 쿠키: `httpOnly: true`, `secure: production`, `sameSite: 'strict'`.

### S3 — 유닛 테스트 53개
- AuthService (13개) + ContentService (13개) + 기존 27개 = 총 53개 · 100% 통과.
- 패턴: `jest.fn()` stub, `$transaction` mock, private 메서드 `(service as unknown as { method })`.

### S4 — Sentry + 인메모리 캐시
- `@sentry/node`: 5xx 에러 → Sentry 전송 (`SENTRY_DSN` env 기반 활성화).
- `@nestjs/cache-manager` v3: 콘텐츠 목록 GET 60초 인메모리 캐시.

### S5 — SSG + sitemap.xml
- `/content/[slug]` SSG 전환: `generateStaticParams()` + `revalidate=3600`.
- `app/sitemap.ts`: 빌드 시 전체 slug fetch → `MetadataRoute.Sitemap` 반환.

## 7. 기술 부채 및 개선 과제

- 임베딩 재인덱싱은 콘텐츠 수정 시마다 동기 수행 → 콘텐츠 증가 시 배치 큐(Redis BullMQ 등) 도입 필요.
- 관리자 단일 계정 + 단순 JWT → 운영 확장 시 RBAC 도입 검토.
- Sentry DSN 환경변수 설정 대기 중 (코드 완성, env만 추가하면 활성화).
