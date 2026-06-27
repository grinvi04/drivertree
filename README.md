# 🌳 DriveTree — 초보운전자 가이드

> **"면허 학원도, 유튜브도, 공식 사이트도 알려주지 않는, 초보운전자가 진짜 막막한 순간들을 정리한 가이드"**

NestJS + Next.js + PostgreSQL 풀스택 서비스. 자세한 기획은 [`PRD.md`](./PRD.md) 참고.

[![CI](https://github.com/grinvi04/drivertree/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/grinvi04/drivertree/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-57%20passed-brightgreen)](https://github.com/grinvi04/drivertree/actions)
[![Live](https://img.shields.io/badge/live-drivertree.vercel.app-blue)](https://drivertree.vercel.app)
[![version](https://img.shields.io/badge/version-1.6.0-blue)](https://github.com/grinvi04/drivertree/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 목차

- [📸 스크린샷](#-스크린샷)
- [✨ 주요 기능](#-주요-기능)
- [🧱 기술 스택](#-기술-스택)
- [🏗️ 아키텍처](#️-아키텍처)
- [🚀 시작하기](#-시작하기)
- [🧪 테스트](#-테스트)
- [📂 디렉터리](#-디렉터리)
- [🔑 주요 API 엔드포인트](#-주요-api-엔드포인트)
- [🔐 보안](#-보안)
- [🌿 환경변수 설정](#-환경변수-설정)
- [🛠️ 개발 규칙](#️-개발-규칙)
- [📚 참고 문서](#-참고-문서)
- [🛡️ 면책](#-면책)
- [📄 라이선스](#-라이선스)

---

## 📸 스크린샷

| 메인 페이지 | AI 챗봇 | 관리자 대시보드 |
|---|---|---|
| ![메인 페이지](docs/screenshots/01-main.png) | ![AI 챗봇](docs/screenshots/02-chatbot.png) | ![관리자 대시보드](docs/screenshots/03-admin.png) |

---

## ✨ 주요 기능

| 기능 | 설명 |
|---|---|
| 📚 실전 가이드 | 비보호좌회전·접촉사고·주차 등 초보자 실생활 시나리오 중심 |
| 🤖 AI 챗봇 | TF-IDF + pgvector 기반 RAG 챗봇. 자연어로 도로 위 궁금증 해결 |
| ⚖️ 범칙금 계산기 | 위반 유형별 과태료·범칙금·벌점 즉시 조회 (어린이보호구역 가중치 포함) |
| 🚗 유지비 계산기 | 차종·연료·주행거리·보험료 입력 → 월별 유지비 자동 산출 |
| 🔒 관리자 백오피스 | 가이드 CRUD + 챗봇 모니터링 로그 대시보드 |

---

## 🧱 기술 스택

| 영역 | 스택 |
|---|---|
| Backend | NestJS 11 · Prisma 7 · PostgreSQL (pgvector 0.5.1) · JWT/Passport · `@sentry/node` |
| Frontend | Next.js 16 (App Router · SSG/ISR) · React 19 · Tailwind v4 · lucide-react |
| 인증 | Access Token 15분 (httpOnly Cookie) + Refresh Token 7일 (httpOnly Cookie + DB 해시 검증) |
| 챗봇 | TF-IDF + 코사인 유사도 기반 로컬 NLP (pgvector 벡터 검색 연동) |
| 캐시 | `@nestjs/cache-manager` — 콘텐츠 목록 60초 인메모리 캐시 |
| 관측 | 구조화 로깅 + AllExceptionsFilter (5xx → Sentry) + RequestLoggerMiddleware |
| 테스트 | Jest 유닛 테스트 57개 (6개 스위트) · 100% 통과 |
| CI/CD | GitHub Actions (lint + build + test) → Railway Staging (`develop`) / Production (`main`) + Vercel |
| 인프라 | Docker Compose (로컬) / Neon PostgreSQL · Railway · Vercel (운영) |

---

## 🏗️ 아키텍처

```mermaid
graph TD
    User(["👤 사용자 브라우저"])

    subgraph Vercel["▲ Vercel"]
        FE["Next.js 16\nSSG 가이드 · ISR 1h revalidate\nCSR 챗봇 · 계산기 · 관리자"]
    end

    subgraph Railway["🚂 Railway"]
        Guard["ThrottlerGuard · JWT Guard\nAllExceptionsFilter"]
        BE["NestJS 11\nauth · content · chat · calculator"]
        Guard --> BE
    end

    subgraph Neon["🐘 Neon PostgreSQL + pgvector"]
        DB["content · chat_log\nrefresh_token · penalty_rule"]
    end

    subgraph CI["⚙️ GitHub Actions"]
        CICD["lint → build → test\n브랜치 보호 · 자동 배포"]
    end

    User -->|"HTTPS"| FE
    FE -->|"HTTPS · httpOnly Cookie\nAccess 15분 + Refresh 7일"| Guard
    BE -->|"SQL + pgvector"| DB
    CICD -->|"main push"| Railway
    CICD -->|"main push"| Vercel
```

**핵심 원칙**

- 프론트는 Vercel, 백엔드·DB는 Railway/Neon으로 분리 — 정적 가이드는 SSG/ISR, 동적 기능은 CSR
- 인증은 httpOnly 쿠키(Access 15분 + Refresh 7일)로만 전달 — 토큰을 JS에 노출하지 않음
- 챗봇 RAG는 외부 LLM API 없이 로컬 NLP(TF-IDF) + pgvector 벡터 검색으로 동작
- `main` push 시 GitHub Actions가 Railway·Vercel로 자동 배포

---

## 🚀 시작하기

### 1. PostgreSQL + pgvector 기동

```bash
docker compose up -d
```

### 2. 백엔드 (NestJS · 포트 4000)

```bash
cd backend
cp .env.example .env          # DATABASE_URL · JWT_SECRET · JWT_REFRESH_SECRET · ADMIN_PASSWORD 필수
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev             # http://localhost:4000/api
```

서버 최초 기동 시 자동으로:
- 관리자 계정 시드 (`ADMIN_USERNAME` / `ADMIN_PASSWORD` 환경변수 기준, **운영 시 반드시 강력한 값으로 변경**)
- 가이드 6건 시드 + 벡터 인덱싱

### 3. 프론트엔드 (Next.js · 포트 3000)

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

---

## 🧪 테스트

```bash
make lint                        # 백엔드 ESLint 체크
make test                        # Jest 유닛 57개 (6 스위트)
make build                       # 프론트엔드 타입체크 + 프로덕션 빌드
make e2e                         # 프론트엔드 Playwright e2e 테스트
make quality                     # 전체 품질 체크 (format + lint + test + build + e2e)
```

> 개별 실행: `(cd backend && npm test)` · `(cd frontend && npm run build)`

---

## 📂 디렉터리

```
DriveTree/
├─ PRD.md                기획서
├─ AGENTS.md             AI 도구 공통 작업 규약
├─ CLAUDE.md             Claude Code 작업 규칙 (git flow · 커밋 메시지)
├─ backend/CLAUDE.md     NestJS · Prisma · Jest 패턴 및 제약 규칙
├─ frontend/CLAUDE.md    Next.js · React · Tailwind v4 패턴 및 제약 규칙
├─ docker-compose.yml    로컬 PostgreSQL + pgvector
├─ backend/              NestJS API (포트 4000)
│  ├─ prisma/            schema.prisma + migrations
│  └─ src/
│     ├─ auth/           JWT httpOnly 쿠키 인증 (access 15분 / refresh 7일)
│     ├─ content/        가이드 CRUD + 벡터 인덱싱 + 60초 캐시
│     ├─ chat/           AI 챗봇 (TF-IDF + pgvector RAG)
│     ├─ calculator/     범칙금 / 유지비 계산기
│     └─ common/         Exception Filter · Request Logger · NLP 헬퍼
└─ frontend/             Next.js (포트 3000)
   └─ src/app/
      ├─ page.tsx              메인 (카테고리 + 검색 + AI 챗봇)
      ├─ content/[slug]/       가이드 상세 (SSG + ISR 1시간 revalidate)
      ├─ calculators/          범칙금/유지비 계산기
      ├─ admin/                관리자 로그인 + 대시보드
      └─ sitemap.ts            sitemap.xml 자동 생성
```

---

## 🔑 주요 API 엔드포인트

모든 경로는 `/api` prefix를 가진다.

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/auth/login` | 로그인 → access/refresh 쿠키 발급 |
| POST | `/auth/refresh` | Refresh Token으로 Access Token 재발급 |
| POST | `/auth/logout` | 쿠키 삭제 + DB refresh hash 무효화 |
| GET  | `/content?category=&search=&page=&limit=` | 가이드 목록 (페이지네이션 + 60초 캐시) |
| GET  | `/content/slug/:slug` | 상세 조회 |
| POST/PATCH/DELETE | `/content/:id` | 관리자 전용 CRUD (JWT Guard) |
| POST | `/chat/ask` | AI 챗봇 질의 |
| POST | `/chat/feedback/:id` | 👍/👎 피드백 |
| GET  | `/chat/logs` | 챗봇 모니터링 로그 (관리자) |
| GET  | `/calculator/penalties` | 범칙금/과태료/벌점 룰 |
| POST | `/calculator/maintenance` | 차량 유지비 추정 |

Swagger UI: `http://localhost:4000/api/docs`

---

## 🔐 보안

| 항목 | 구현 |
|---|---|
| 인증 | JWT httpOnly Cookie (XSS 토큰 탈취 방지) |
| Refresh Token | 7일 만료 + DB 해시 검증 (탈취 시 서버측 무효화 가능) |
| Rate Limiting | `/chat/ask` 분당 10회 / 시간당 60회 (ThrottlerModule) |
| 프롬프트 인젝션 | 한국어 패턴 감지 (`chat/chat.service.ts`) |
| XSS | DOMPurify sanitize (`isomorphic-dompurify`) |
| CSP | Next.js 보안 헤더 (`next.config.ts`) — CSP · X-Frame-Options · X-Content-Type-Options |

---

## 🌿 환경변수 설정

### 백엔드 필수 (`backend/.env`)

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `JWT_SECRET` | Access Token 서명 비밀키 |
| `JWT_REFRESH_SECRET` | Refresh Token 서명 비밀키 (JWT_SECRET과 다른 값) |
| `ADMIN_PASSWORD` | 관리자 계정 비밀번호 — **필수** (미설정 시 서버 기동 불가) |

### 백엔드 선택

| 변수 | 설명 |
|---|---|
| `SENTRY_DSN` | [sentry.io](https://sentry.io) → Node.js 프로젝트 생성 → DSN 복사 |

---

## 🛠️ 개발 규칙

- 브랜치: `develop → feature/* | fix/* → PR → develop` · 릴리즈 `release/* → main(tag)`. **`main`·`develop` 직접 커밋 금지.**
- 커밋: `타입(범위): 제목` (`feat`·`fix`·`refactor`·`test`·`docs`·`chore`·`ci`)
- 의존성은 `npm ci` 사용. 작업 규약·아키텍처는 [CLAUDE.md](CLAUDE.md) 참고.

---

## 📚 참고 문서

- [AGENTS.md](AGENTS.md) — AI 도구 공통 작업 규약
- [CLAUDE.md](CLAUDE.md) — Claude Code 작업 규칙 (git flow · 커밋 메시지)
- [PRD.md](PRD.md) — 제품 기획서
- [DESIGN.md](DESIGN.md) · [DESIGN_IMPL.md](DESIGN_IMPL.md) — 디자인 명세·구현

---

## 🛡️ 면책

본 사이트의 범칙금 · 유지비 수치는 공식 자료 기반의 **추정값**이며 실제 처분과 다를 수 있습니다. 운전 관련 결정은 반드시 공식 자료를 직접 확인해 주세요.

---

## 📄 라이선스

[MIT](LICENSE)
