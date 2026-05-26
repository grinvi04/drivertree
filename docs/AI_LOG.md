# 🤖 AI 활용 로그 (DriveTree)

본 문서는 PRD의 *"AI Agent 활용 능력 시연"* 목표에 따라, DriveTree 개발 전 과정에서 AI 협업이 어떻게 사용되었는지 투명하게 기록한다.

## 1. 활용 모델 / 도구

| 단계 | 사용 도구 | 용도 |
|---|---|---|
| 기획 | Claude (대화형) | 페르소나·MVP·카테고리 구조 발산 → PRD v0.1 정리 |
| 백엔드 코드 | Anthropic 계열 Agent (Antigravity → Claude 이관) | NestJS 모듈/서비스 스캐폴딩, Prisma 스키마 작성, pgvector 쿼리 작성 |
| 프론트 코드 | 동일 Agent | Next.js App Router 페이지, Tailwind v4 디자인 시스템, 마크다운 미니 렌더러 |
| 콘텐츠 시드 | Gemini + 사람 검수 | 시드 가이드 4건 초안 → 법규 정확성 사람 검수 |
| 챗봇 (런타임) | Gemini `text-embedding-004` + `gemini-1.5-flash` | 사용자 질의 RAG (임베딩 + 답변 생성) |
| 폴백 (런타임) | 자체 구현 TF-IDF + 코사인 유사도 | API Key 미설정/장애 시 무중단 답변 |

## 2. 분담 원칙

- **AI가 한 일**: 보일러플레이트 코드, 디자인 토큰 제안, 한국어 톤의 카피라이팅 초안, 카테고리/태그 정규화.
- **사람이 한 일**: PRD 의사결정, 법규 정확성 검증, 데이터 모델/도메인 결정, 보안 정책 (JWT secret, CORS, Rate limit 정책 결정).

## 3. RAG 설계 결정

1. **벡터 DB**: Pinecone/Qdrant 대신 **pgvector**를 선택 — 인프라 1개로 끝나는 단순성과, Prisma `Unsupported("vector(768)")` 타입으로 그대로 모델링 가능.
2. **차원수 768**: Gemini `text-embedding-004` 출력에 맞춤. 추후 모델 교체 시 마이그레이션 1줄로 변경 가능.
3. **거리 임계치 0.6**: 코사인 거리 기준. 한국어 짧은 질문에서 노이즈가 너무 많이 섞이지 않도록 보수적으로 설정.
4. **청크 사이즈 500자**: 한국어 문장 단위로 자연 분절. Gemini 1.5 컨텍스트에 3 청크까지 합쳐도 4k 미만이라 비용 안전.
5. **로컬 폴백**: 외부 API에 100% 의존하지 않게 하기 위해 TF-IDF + 코사인 유사도 헬퍼를 별도 구현 (`common/local-nlp.helper.ts`). 한국어 조사 stopword 처리 포함.

## 4. 프롬프트 패턴 (챗봇)

```
[가이드 컨텍스트] (pgvector 상위 3 청크)
[사용자 질문]
→ 시스템 프롬프트로 "초보운전자의 든든한 등대" 페르소나 부여
→ 컨텍스트 없으면 안전한 도로교통 원칙 기반 답변 + 격려
→ 단계 설명이 필요한 답변(사고 대처 등)은 번호 매겨 답변
```

이 패턴 덕분에 컨텍스트가 비어도 *"관련 콘텐츠를 찾을 수 없습니다"* 같이 끊기지 않고 자연스럽게 일반 조언으로 fallback된다.

## 5. 작업 인계 메모

본 프로젝트는 외부 Agent(Antigravity)에서 시작되어 사용량 한도로 작업이 중단된 후 Claude Code 환경에서 이어받았다. 인계 시 다음을 점검했다.

- Prisma 7.x에서 `datasourceUrl` 옵션이 제거되어 `PrismaService` 수정 (env DATABASE_URL 자동 로딩으로 변경).
- React 19 신규 hooks 규칙(`react-hooks/set-state-in-effect`, `react-hooks/immutability`)이 매우 엄격해 ESLint에서 warning 처리.
- `any` 타입과 deprecated `String.prototype.substr` 제거.
- 운영 가이드(`README.md`, `.env.example`, 본 문서) 추가.

## 7. CI/CD 안정화 작업 (2026-05-25, Claude Code)

v1.1.0 quality sprint 이후 GitHub Actions CI가 연속 실패. Claude Code와 협업해 5건 순차 수정.

| # | 증상 | 원인 | 해결 |
|---|---|---|---|
| 1 | 백엔드 lint 80+ prettier 에러 | 코드 변경 후 `npm run format` 미실행 | `npm run format` 일괄 실행, 19개 파일 자동 수정 |
| 2 | 프론트 `npm ci` EUSAGE | npm 10.x가 wasm32-only optional 패키지(`@unrs/resolver-binding-wasm32-wasi`)의 하위 의존성을 lock 파일에서 찾지 못함 | CI workflow를 `npm install`로 변경, wasm32 패키지는 플랫폼 불일치로 자동 skip |
| 3 | 백엔드 TS 빌드 TS2322 | `chat.service.ts:212` `item.slug`가 `string \| undefined`인데 `MatchedSource.slug`는 `string` | `slug: item.slug ?? ''` |
| 4 | 프론트 ESLint error (preserve-manual-memoization) | `useMemo` 본문에서 `post.content`, deps에서 `post?.content` — React Compiler가 불일치 감지 | 본문을 `post?.content`로 통일 |
| 5 | 백엔드 유닛 테스트 1건 실패 | 인젝션 감지 regex `\s*`가 "이전의 **모든** 지시를 무시해" 의 중간 단어를 허용 못 함 | `\s*` → `.*?` (lazy wildcard) |

**배운 점:**
- npm 버전 차이(10 vs 11)가 lock 파일 검증 동작에 영향을 줌. CI 환경 Node/npm 버전을 로컬과 맞추거나, optional 패키지 lock 파일 이슈는 `npm install` fallback이 안전.
- React Compiler(19)는 `useMemo` deps를 정적 분석해 본문과 불일치 시 error. `post?.content`처럼 optional chaining은 deps와 본문에서 동일하게 사용해야 함.
- 백엔드 소스 수정 시 prettier 실행은 필수 단계. 후속 세션에서도 반드시 `npm run format` 선행.

## 8. v1.4.0 품질 스프린트 (2026-05-26~27, Claude Code)

5개 스프린트로 코드베이스를 포트폴리오 상용 수준으로 격상.

### S1 — API 품질 (페이지네이션 · Swagger · DTO)
- 콘텐츠 목록에 cursor 기반 페이지네이션 + `PaginatedResult<T>` 제네릭 반환 타입 도입.
- Swagger `@ApiTags`, `@ApiOperation`, `@ApiResponse` 전 엔드포인트 적용. `/api/docs`에서 인터랙티브 문서 확인 가능.
- 시드 파일을 `prisma/seed.ts`로 분리 (서비스 코드에서 시드 로직 제거).

### S2 — JWT httpOnly 쿠키 + Refresh Token
- Access Token 15분 / Refresh Token 7일 이중 토큰 구조 도입.
- 두 토큰 모두 httpOnly Cookie로 발급 → XSS로 인한 토큰 탈취 차단.
- Refresh Token은 bcrypt 해시로 DB 저장 → 서버측 무효화(logout) 가능.
- **결정 이유**: localStorage 기반은 XSS 시 토큰이 그대로 탈취됨. 포트폴리오지만 보안 설계는 실서비스 수준으로.
- 쿠키 설정: `httpOnly: true`, `secure: NODE_ENV==='production'`, `sameSite: 'strict'`.
- Swagger Bearer 폴백 유지 (`ExtractJwt.fromExtractors([cookieExtractor, bearerFallback])`).

### S3 — 유닛 테스트 53개
- `AuthService` (13개): login 정상/미존재/비밀번호오류, refreshAccessToken 정상/만료/hash없음/변조, logout.
- `ContentService` (13개): chunkText 단일/멀티/손실없음/빈문자열, create DTO/충돌, findOne 정상/404, remove, findAll 페이지네이션.
- 기존 테스트 27개 포함 총 53개 · 100% 통과.
- **패턴 확정**: `jest.fn()` stub으로 PrismaService/JwtService 교체, `$transaction` mock은 `Promise.all(ops)`, private 메서드 접근은 `(service as unknown as { method })`.
- CLAUDE.md에 테스트 규칙 섹션 추가 (mock 전략 · 커버리지 기준 · 작성 순서).

### S4 — Sentry + 인메모리 캐시
- `@sentry/node`: `AllExceptionsFilter`에서 5xx 에러를 Sentry로 전송. `SENTRY_DSN` env가 있을 때만 활성화.
- `@nestjs/cache-manager` v3: 콘텐츠 목록 GET 응답을 60초 인메모리 캐시. `CacheModule.register({ isGlobal: true, ttl: 60_000 })`.
- **CI 실패 원인**: Sprint 4 커밋 시 `backend/package.json`과 `package-lock.json`을 스테이지하지 않아 CI에서 두 패키지를 찾지 못해 `@typescript-eslint/no-unsafe-call` 에러 발생. `fix/sentry-cache-deps` 브랜치로 수정.

### S5 — SSG + sitemap.xml
- `/content/[slug]` 페이지를 CSR에서 SSG로 전환. `generateStaticParams()` + `export const revalidate = 3600` + `dynamicParams = true`.
- `DOMPurify` sanitize를 서버측으로 이동 (빌드 시 처리).
- `app/sitemap.ts`: 빌드 시 모든 콘텐츠 slug를 API에서 fetch해 `MetadataRoute.Sitemap` 반환. API 불가 시 홈 URL만 반환(graceful fallback).

## 6. 한계와 후속 과제

- 챗봇 답변 비용/속도 모니터링은 단순 로그만 남기고 있음 — Sentry 연동은 코드 완성, SENTRY_DSN 환경변수 설정 필요.
- 임베딩 재인덱싱은 콘텐츠 수정 시마다 수행 → 대량 콘텐츠 시 배치 큐(Redis BullMQ 등) 도입 필요.
- 관리자 단일 계정 + 단순 JWT → 운영 확장 시 RBAC 필요.
- CI push 트리거 간헐적 비활성화 (develop 브랜치 한정, 원인 미상). `workflow_dispatch`로 수동 트리거 대응 중.
