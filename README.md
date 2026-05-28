# 🌳 DriveTree — 초보운전자 가이드

[![CI](https://github.com/grinvi04/drivertree/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/grinvi04/drivertree/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-71%20passed-brightgreen)](https://github.com/grinvi04/drivertree/actions)
[![Live](https://img.shields.io/badge/live-drivetree.vercel.app-blue)](https://drivetree.vercel.app)

> **"면허 학원도, 유튜브도, 공식 사이트도 알려주지 않는, 초보운전자가 진짜 막막한 순간들을 정리한 가이드"**

NestJS + Next.js + PostgreSQL 풀스택 서비스. 자세한 기획은 [`PRD.md`](./PRD.md) 참고.

---

## ✨ 주요 기능

| 기능 | 설명 |
|---|---|
| 📚 실전 가이드 | 비보호좌회전·접촉사고·주차 등 초보자 실생활 시나리오 중심 |
| 🤖 AI 챗봇 | TF-IDF + pgvector 기반 RAG 챗봇. 자연어로 도로 위 궁금증 해결 |
| ⚖️ 범칙금 계산기 | 위반 유형별 과태료·범칙금·벌점 즉시 조회 (어린이보호구역 가중치 포함) |
| 🚗 유지비 계산기 | 차종·연료·주행거리·보험료 입력 → 월별 유지비 자동 산출 |
| 📖 법령 검색 | 법제처 국가법령정보 API 기반 교통 법령 원문 바로 조회 |
| 🚨 사고 다발지점 | 도로교통공단 TAAS 기반 지역별 교통사고 집중 구간 안내 |
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
| 공공 API | 법제처 국가법령정보 · 도로교통공단 TAAS |
| 테스트 | Jest 유닛 테스트 71개 (7개 스위트) · 100% 통과 |
| CI/CD | GitHub Actions (lint + build + test) → Railway Staging (`develop`) / Production (`main`) + Vercel |
| 인프라 | Docker Compose (로컬) / Neon PostgreSQL · Railway · Vercel (운영) |

---

## 🏗️ 아키텍처

```
사용자 브라우저
      │
      ▼
┌─────────────────────────────────┐
│  Vercel (Next.js 16)            │
│  SSG 가이드 + CSR 챗봇/계산기    │
└───────────────┬─────────────────┘
                │ HTTPS  (httpOnly Cookie)
                ▼
┌─────────────────────────────────┐
│  Railway (NestJS 11, 포트 4000) │
│  ┌──────────────────────────┐   │
│  │ ThrottlerGuard (Rate Limit)│  │
│  │ JWT Guard (httpOnly Cookie)│  │
│  │ AllExceptionsFilter (Sentry)│ │
│  └──────────────────────────┘   │
│  auth · content · chat          │
│  calculator · law · safety      │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  Neon PostgreSQL (pgvector)     │
│  content · chat_log             │
│  refresh_token · penalty_rule   │
└─────────────────────────────────┘
```

---

## 📂 디렉터리

```
DriveTree/
├─ PRD.md                기획서
├─ CLAUDE.md             Claude Code 작업 규칙 (git flow · 커밋 메시지 · 테스트)
├─ docker-compose.yml    로컬 PostgreSQL + pgvector
├─ backend/              NestJS API (포트 4000)
│  ├─ prisma/            schema.prisma + migrations
│  └─ src/
│     ├─ auth/           JWT httpOnly 쿠키 인증 (access 15분 / refresh 7일)
│     ├─ content/        가이드 CRUD + 벡터 인덱싱 + 60초 캐시
│     ├─ chat/           AI 챗봇 (TF-IDF + pgvector RAG)
│     ├─ calculator/     범칙금 / 유지비 계산기
│     ├─ law/            법제처 법령 검색 API 연동
│     ├─ safety/         TAAS 사고다발지점 API 연동
│     └─ common/         Exception Filter · Request Logger · NLP 헬퍼
└─ frontend/             Next.js (포트 3000)
   └─ src/app/
      ├─ page.tsx              메인 (카테고리 + 검색 + AI 챗봇)
      ├─ content/[slug]/       가이드 상세 (SSG + ISR 1시간 revalidate)
      ├─ calculators/          범칙금/유지비 계산기
      ├─ law/                  법제처 법령 검색
      ├─ safety/               TAAS 사고 다발지점
      ├─ admin/                관리자 로그인 + 대시보드
      └─ sitemap.ts            sitemap.xml 자동 생성
```

---

## 🚀 빠른 시작 (3 step)

### 1. PostgreSQL + pgvector 기동

```bash
docker compose up -d
```

### 2. 백엔드 (NestJS)

```bash
cd backend
cp .env.example .env          # DATABASE_URL · JWT_SECRET · JWT_REFRESH_SECRET 필수
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev              # http://localhost:4000/api
```

서버 최초 기동 시 자동으로:
- 관리자 계정 시드 (`ADMIN_USERNAME` / `ADMIN_PASSWORD` 환경변수 기준, **운영 시 반드시 강력한 값으로 변경**)
- 가이드 6건 시드 + 벡터 인덱싱

### 3. 프론트엔드 (Next.js)

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                    # http://localhost:3000
```

---

## 🔑 주요 API 엔드포인트 (`/api` prefix)

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
| GET  | `/law/search?query=` | 법제처 법령 검색 |
| GET  | `/safety/hotspots?siDo=&guGun=` | TAAS 사고 다발지점 조회 |

Swagger UI: `http://localhost:4000/api/docs`

---

## 🔐 보안

| 항목 | 구현 |
|---|---|
| 인증 | JWT httpOnly Cookie (XSS 토큰 탈취 방지) |
| Refresh Token | 7일 만료 + DB 해시 검증 (탈취 시 서버측 무효화 가능) |
| Rate Limiting | `/chat/ask` 분당 10회 / 시간당 60회 (ThrottlerModule) |
| 프롬프트 인젝션 | 한국어 패턴 감지 (`common/prompt-injection.guard.ts`) |
| XSS | DOMPurify 이중 sanitize (저장 시 + 렌더링 시) |
| CSP | NestJS Helmet — `Content-Security-Policy` 헤더 |

---

## 🌿 환경변수 설정

### 백엔드 필수 (`backend/.env`)

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `JWT_SECRET` | Access Token 서명 비밀키 |
| `JWT_REFRESH_SECRET` | Refresh Token 서명 비밀키 (JWT_SECRET과 다른 값) |

### 백엔드 선택

| 변수 | 설명 |
|---|---|
| `SENTRY_DSN` | [sentry.io](https://sentry.io) → Node.js 프로젝트 생성 → DSN 복사 |
| `LAW_API_KEY` | [law.go.kr 오픈API](https://www.law.go.kr/LSW/openapiInfoR.do) OC 키 |
| `TAAS_API_KEY` | [openapi.taas.koroad.or.kr](https://openapi.taas.koroad.or.kr) API 키 |

> 선택 환경변수 미설정 시 해당 기능은 "API 키 미설정" 안내 메시지를 반환하며, 나머지 서비스는 정상 동작합니다.

---

## 🛡️ 면책

본 사이트의 범칙금 · 유지비 수치는 공식 자료 기반의 **추정값**이며 실제 처분과 다를 수 있습니다. 운전 관련 결정은 반드시 공식 자료를 직접 확인해 주세요.

## 📜 라이선스

MIT
