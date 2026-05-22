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

## 6. 한계와 후속 과제

- 챗봇 답변 비용/속도 모니터링은 단순 로그만 남기고 있음 — Prometheus/Sentry 연동 미적용.
- 임베딩 재인덱싱은 콘텐츠 수정 시마다 수행 → 대량 콘텐츠 시 배치 큐(Redis BullMQ 등) 도입 필요.
- 콘텐츠 카탈로그 SEO를 위해 추후 `/content/[slug]`를 SSG/ISR로 전환 권장 (현재 CSR).
- 관리자 단일 계정 + 단순 JWT → 운영 확장 시 RBAC 필요.
