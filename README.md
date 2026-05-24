# 🌳 DriveTree — 초보운전자 가이드

> **"면허 학원도, 유튜브도, 공식 사이트도 알려주지 않는, 초보운전자가 진짜 막막한 순간들을 정리한 가이드"**

NestJS + Next.js + PostgreSQL(pgvector) + Gemini(RAG) 풀스택 MVP. 자세한 기획은 [`PRD.md`](./PRD.md) 참고.

---

## 🧱 기술 스택

| 영역 | 스택 |
|---|---|
| Backend | NestJS 11 · Prisma 7 · PostgreSQL (pgvector 0.5.1) · JWT/Passport · `@google/generative-ai` |
| Frontend | Next.js 16 (App Router) · React 19 · Tailwind v4 · lucide-react |
| RAG | Gemini `text-embedding-004` (768-dim) → pgvector 코사인 유사도 검색 → `gemini-1.5-flash` 답변 생성. **API Key 미설정 시** 로컬 TF-IDF + 코사인 폴백으로 자동 전환되어 항상 동작. |
| 인프라 | Docker Compose (Postgres 단독) |

## 📂 디렉터리

```
DriveTree/
├─ PRD.md                기획서
├─ docker-compose.yml    PostgreSQL + pgvector
├─ backend/              NestJS API (포트 4000)
│  ├─ prisma/            schema.prisma + migrations
│  └─ src/
│     ├─ auth/           JWT 기반 단일 관리자 인증
│     ├─ content/        가이드 CRUD + 임베딩 인덱싱
│     ├─ chat/           RAG 챗봇 + 로컬 NLP 폴백
│     ├─ calculator/     범칙금 / 유지비 계산기
│     └─ common/local-nlp.helper.ts  토큰화 + 코사인 유사도
├─ frontend/             Next.js (포트 3000)
│  └─ src/app/
│     ├─ page.tsx              메인 (카테고리 + 검색 + 챗봇)
│     ├─ content/[slug]/       가이드 상세 + 마크다운 렌더링
│     ├─ calculators/          범칙금/유지비 계산기
│     └─ admin/                관리자 로그인 + 대시보드
└─ docs/AI_LOG.md        AI 활용 사례 로그
```

## 🚀 빠른 시작 (3 step)

### 1. PostgreSQL + pgvector 기동

```bash
docker compose up -d
```

### 2. 백엔드 (NestJS)

```bash
cd backend
cp .env.example .env       # DATABASE_URL · JWT_SECRET · GEMINI_API_KEY
npm install                # @prisma/adapter-pg, pg 등 driver adapter 패키지 포함
npx prisma generate        # driverAdapters 프리뷰 기능 반영
npx prisma migrate deploy  # 마이그레이션 적용 + pgvector 확장 활성화
npm run start:dev          # http://localhost:4000/api
```

> **참고**: Prisma 7부터 PrismaClient는 **driver adapter**(`@prisma/adapter-pg`) 또는 Prisma Accelerate URL이 필수입니다. 본 프로젝트는 로컬 Postgres + pgvector 환경이므로 `@prisma/adapter-pg + pg`를 사용합니다.

서버 최초 기동 시 자동으로 다음이 수행됩니다.

- 관리자 계정 시드 — 환경변수 `ADMIN_USERNAME` / `ADMIN_PASSWORD`로 관리. **운영 배포 시 반드시 `ADMIN_PASSWORD`를 강력한 값으로 설정**할 것(미설정 시 로컬 개발 편의용 기본값만 적용되며, 운영 환경에서는 절대 사용 금지). 환경변수 변경 후 재배포하면 기존 계정 비밀번호가 자동 동기화된다. 로컬 개발용 기본값은 `backend/.env.example`와 `backend/src/auth/auth.service.ts` 참고.
- 가이드 6건 시드(slug 기준 idempotent — 누락된 항목만 삽입) + 청크별 Gemini 임베딩 적재(API Key 있을 때) 또는 텍스트만 적재(없을 때)
  - `license-school-vs-self` / `license-type-1-vs-2`
  - `rules-unprotected-left-turn`
  - `basics-alleyway-priority`
  - `accidents-crash-guide`
  - `maintenance-engine-oil-cycle`

### 3. 프론트엔드 (Next.js)

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                # http://localhost:3000
```

`NEXT_PUBLIC_API_URL`이 비어 있으면 자동으로 `http://localhost:4000/api`를 사용합니다.

## 🤖 RAG 동작 흐름

```
사용자 자연어 질문
   ↓
Gemini text-embedding-004 → 768-dim 벡터
   ↓
pgvector 코사인 거리(<=>) 정렬 → 상위 3 chunk (거리 ≤ 0.6 필터)
   ↓
gemini-1.5-flash 시스템 프롬프트 + 컨텍스트로 답변 생성
   ↓
ChatLog 테이블에 질문/답변/매칭 출처 적재 (관리자 대시보드 모니터링)
```

`GEMINI_API_KEY`가 비어 있거나 API 호출이 실패하면 `common/local-nlp.helper.ts`의 TF-IDF + 코사인 유사도 기반 로컬 폴백이 자동으로 가동되어 서비스가 끊기지 않습니다.

## 🔑 주요 API 엔드포인트 (모두 `/api` prefix)

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/auth/login` | JWT 토큰 발급 |
| GET  | `/content?category=&search=` | 가이드 목록 (검색은 TF-IDF 랭킹 후 필터) |
| GET  | `/content/slug/:slug` | 상세 조회 |
| POST/PATCH/DELETE | `/content/:id` | 관리자(JWT) 전용 CRUD — 본문 수정 시 임베딩 자동 재생성 |
| POST | `/chat/ask` | RAG 챗봇 질의 |
| POST | `/chat/feedback/:id` | 👍/👎 피드백 |
| GET  | `/chat/logs` | 챗봇 모니터링 로그 (관리자) |
| GET  | `/calculator/penalties` | 범칙금/과태료/벌점 룰 |
| POST | `/calculator/maintenance` | 차량 유지비 추정 |

## 🛡️ 면책

본 사이트의 범칙금 · 유지비 수치는 도로교통공단 등 공식 자료 기반의 **추정값**이며, 실제 처분과 다를 수 있습니다. 운전 관련 결정은 반드시 공식 자료를 직접 확인해 주세요.

## 📜 라이선스

MIT (PRD 명시 시까지 임시) · 학습/포트폴리오 목적.
