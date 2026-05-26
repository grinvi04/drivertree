# 🚀 DriveTree — 배포 가이드

> 옵션 A: **Neon (DB) + Railway (백엔드) + Vercel (프론트)** 조합.
> 비용 0원, 30분 내 운영 URL 확보 가능.
> 옵션 B(AWS 풀스택)는 본 가이드 완료 후 별도 문서 작성 예정.

> **CI/CD 파이프라인 전체 구조** (브랜치 전략, GitHub Environments, 스테이징 환경 설정)는
> [`docs/CI_CD.md`](./CI_CD.md) 를 먼저 읽을 것.

---

## 0. 사전 준비

- GitHub 계정에 DriveTree 레포 push 완료 상태 (모노레포 구조: `backend/`, `frontend/`)
- 다음 3개 서비스 계정 (모두 GitHub 로그인 가능, 신용카드 안 필요):
  - [Neon](https://neon.tech) — PostgreSQL 0.5GB 무료
  - [Railway](https://railway.app) — 트라이얼 $5 크레딧 (소형 서비스 1~2개월 충분), GitHub 계정 인증 시 무료 분량 추가
  - [Vercel](https://vercel.com) — Next.js 무료 hobby plan
- Gemini API Key (선택, 챗봇 RAG 품질 검증용) — [Google AI Studio](https://aistudio.google.com)에서 발급

---

## 1. Neon — PostgreSQL + pgvector

### 1.1 프로젝트 생성
1. https://console.neon.tech → **New Project**
2. Region: `Asia Pacific (Singapore)` 권장 (한국에서 latency 가장 짧음)
3. PostgreSQL 버전: **16** (pgvector 공식 지원)
4. Database 이름: `drivetree` (기본 `neondb` 그대로도 무관)

### 1.2 pgvector 확장 활성화
Neon은 pgvector를 기본 지원하지만 확장은 명시적으로 활성화해야 한다. **두 가지 방법 중 하나**:

- **방법 A (자동)**: 본 프로젝트 마이그레이션 (`backend/prisma/migrations/.../migration.sql`) 첫 줄에 이미 `CREATE EXTENSION IF NOT EXISTS "vector"` 가 포함되어 있어, Railway가 `prisma migrate deploy` 를 돌릴 때 자동 활성화됨. **추가 작업 불필요.**
- **방법 B (수동 확인)**: Neon 콘솔의 **SQL Editor**에서:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  SELECT extname FROM pg_extension WHERE extname = 'vector';  -- 'vector' 1행 나오면 OK
  ```

### 1.3 Connection String 복사
- Neon 콘솔 → **Dashboard** → **Connection Details** → **Pooled connection** 토글 **OFF** (Prisma는 직접 연결 권장)
- 형식: `postgresql://USER:PASSWORD@ep-xxx.ap-southeast-1.aws.neon.tech/drivetree?sslmode=require`
- **이 문자열을 어딘가에 임시 저장** — 다음 단계(Railway)에서 환경변수로 입력

---

## 2. Railway — NestJS 백엔드

### 2.1 새 프로젝트 + GitHub 연동
1. https://railway.app/new → **Deploy from GitHub repo**
2. 본 레포 선택
3. **Root Directory**: `backend` (필수 — 모노레포라서)
4. Branch: `main` (또는 본인의 메인 브랜치)

### 2.2 환경변수 설정
Railway 프로젝트 → **Variables** 탭에서 다음 추가:

| 변수 | 값 | 비고 |
|---|---|---|
| `DATABASE_URL` | (1.3에서 복사한 Neon 문자열) | 필수 |
| `JWT_SECRET` | 임의의 긴 문자열 (32자+) | `openssl rand -base64 32` 추천 |
| `JWT_REFRESH_SECRET` | 임의의 긴 문자열 (32자+, JWT_SECRET과 **다른 값**) | Refresh Token 서명용. 필수 |
| `GEMINI_API_KEY` | (선택) Google AI Studio 키 | 비워두면 로컬 폴백으로 자동 전환 |
| `SENTRY_DSN` | (선택) Sentry 프로젝트 DSN | 있으면 5xx 에러 자동 전송 |
| `ALLOWED_ORIGINS` | (2.3 이후 입력) Vercel 도메인 | 일단 비워두고 Vercel 배포 후 추가 |
| `NODE_ENV` | `production` |  |
| `NEST_LOG_LEVEL` | `log,warn,error` | 선택. production 권장값 |

> `PORT`는 Railway가 자동 주입하므로 **입력하지 말 것**.

### 2.3 빌드/배포
- 이미 작성된 `backend/railway.json` 이 자동 인식됨:
  - **Build**: `npm install && npx prisma generate && npm run build`
  - **Start**: `npx prisma migrate deploy && node dist/src/main.js`
  - **Healthcheck**: `/api`
- 첫 배포에 약 3~5분 소요. 빌드 로그에서 다음을 확인:
  - `✔ Generated Prisma Client` (Prisma 7 driver adapter 동작)
  - `Applying migration` (Neon에 스키마 + pgvector extension 적용)
  - `🌱 [DriveTree Seed] Inserted 6 new seed content(s).` (시드 적재)
  - `🚀 DriveTree Backend running on: http://localhost:<RAILWAY_PORT>/api`

### 2.4 공개 도메인 발급
- Railway 프로젝트 → **Settings** → **Networking** → **Generate Domain**
- `https://drivetree-production-XXXX.up.railway.app` 같은 도메인 생성됨
- 브라우저로 `https://drivetree-production-XXXX.up.railway.app/api` 접속 → `Hello World!` 응답 확인
- **이 도메인을 어딘가에 저장** — 다음 단계(Vercel)에서 사용

---

## 3. Vercel — Next.js 프론트엔드

### 3.1 새 프로젝트 + GitHub 연동
1. https://vercel.com/new → 본 레포 선택
2. **Root Directory**: `frontend` (필수)
3. Framework Preset: Next.js (자동 감지)

### 3.2 환경변수 설정
**Environment Variables** 섹션에서:

| 변수 | 값 |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://drivetree-production-XXXX.up.railway.app/api` (2.4에서 복사) |

### 3.3 첫 배포
- **Deploy** 클릭 → 2~3분 빌드
- 완료 시 `https://drivetree.vercel.app` (또는 `https://drivetree-<hash>.vercel.app`) 도메인 발급
- **이 도메인을 어딘가에 저장**

---

## 4. CORS 화이트리스트 갱신 (Vercel 도메인 → Railway에 입력)

`backend/src/main.ts`의 CORS가 `*.vercel.app`은 자동 허용하지만, 명시적으로 한 번 더 입력해두면 보안과 디버깅에 좋다.

1. Railway 프로젝트 → **Variables** → `ALLOWED_ORIGINS` 추가:
   ```
   https://drivetree.vercel.app,https://drivetree-<hash>.vercel.app
   ```
2. Railway가 자동 재배포 시작 (env 변경 시 자동 트리거)
3. Vercel 사이트 접속 → 메인 페이지 카드 6개 로딩 확인

---

## 5. 동작 검증 체크리스트

배포 끝나면 5분 안에 한 번씩 클릭:

- [ ] Vercel 메인 페이지에 콘텐츠 카드 **6개** 모두 표시
- [ ] 카드 클릭 → 콘텐츠 상세 페이지 마크다운 렌더링 정상
- [ ] 챗봇 다이얼로그 → *"엔진오일 언제 갈아야 해요?"* → 답변 + 출처 카드 노출
- [ ] `/calculators` 페이지에서 범칙금/유지비 계산기 동작
- [ ] `/admin/login` → `admin` / (Railway에 설정한 `ADMIN_PASSWORD` 값) 으로 로그인 → 대시보드 진입
- [ ] 브라우저 콘솔(F12)에 CORS 에러 없음
- [ ] Railway 로그에 5xx 에러 없음

---

## 6. 트러블슈팅

### "Cannot find module 'dist/src/main.js'" 오류
- `npm run build` 가 실패한 상태. Railway 빌드 로그의 `nest build` 출력 확인.
- 대부분 TypeScript 타입 에러 또는 Prisma generate 실패. 로컬에서 `npm run build` 먼저 통과시키고 push.

### "P1001: Can't reach database server"
- `DATABASE_URL` 끝에 `?sslmode=require` 가 빠졌을 가능성. Neon은 SSL 필수.
- 또는 Neon 프로젝트가 idle 상태 → 첫 요청은 약 5초 cold start. Healthcheck timeout을 60초로 설정해둠.

### CORS 에러 (브라우저 콘솔에 "Access-Control-Allow-Origin")
- Railway `ALLOWED_ORIGINS` 에 실제 Vercel 도메인이 정확히 들어갔는지 확인 (https:// 포함, 끝에 / 없이).
- Vercel preview 배포(`*.vercel.app`)는 main.ts에서 자동 허용하지만, 커스텀 도메인 쓰면 명시 추가.

### Gemini 호출 실패 → 로컬 폴백
- 정상 동작. `GEMINI_API_KEY` 미설정이거나 호출 실패 시 자동으로 TF-IDF 폴백 가동 (서비스 안 끊김).
- 진짜 RAG로 동작하는지 확인하려면 Railway 로그에 `Failed to get query embedding` 가 없는지 확인.

### Rate limit 429 응답
- 정상. `/chat/ask` 는 분당 10회 / 시간당 60회 (Gemini 비용 보호). 데모에선 충분.
- 인터뷰 데모 등에서 한도 늘려야 하면 `backend/src/chat/chat.controller.ts` 의 `@Throttle` 값 수정 후 재배포.

---

## 7. 비용 예상 (월)

| 서비스 | 무료 한도 | 예상 비용 |
|---|---|---|
| Neon | 0.5GB storage, 191 compute hours | $0 (트래픽 거의 없는 포트폴리오 기준) |
| Railway | $5 트라이얼 + GitHub 인증 시 $5/월 추가 | $0~5 |
| Vercel | 100GB bandwidth, 빌드 6000분 | $0 |
| Gemini API | 분당 15 RPM, 일 1500 RPD 무료 | $0 (인터뷰 5명 데모 충분) |
| **합계** | | **$0~5/월** |

3개월 후에도 트래픽이 거의 없다면 사실상 평생 무료.

---

## 8. 다음 단계 — 옵션 B (AWS) 진입 시점

옵션 A 배포가 1주 이상 안정적으로 돌면 옵션 B 작성. 예상 구성:
- **CloudFront + S3 + Amplify Hosting** (프론트) — 또는 Vercel 그대로 유지
- **ECS Fargate + ALB** (백엔드) — Docker 이미지 빌드 → ECR 푸시 → Fargate Task
- **RDS for PostgreSQL 16 + pgvector** (DB) — 또는 Neon 그대로 유지
- **Route 53 + ACM** (도메인 + SSL)
- **CloudWatch + X-Ray** (관측)

이 단계는 별도 가이드 `docs/DEPLOYMENT_AWS.md` 로 분리 예정.
