# 🚀 DriveTree — 배포 가이드

> **Neon (DB) + Railway (백엔드) + Vercel (프론트)** 조합.
> CI/CD 파이프라인 전체 구조는 [`docs/CI_CD.md`](./CI_CD.md) 참고.

---

## 0. 사전 준비

- GitHub 계정에 DriveTree 레포 push 완료 상태 (모노레포 구조: `backend/`, `frontend/`)
- 다음 3개 서비스 계정:
  - [Neon](https://neon.tech) — PostgreSQL 0.5GB 무료
  - [Railway](https://railway.app) — $5/월 hobby plan
  - [Vercel](https://vercel.com) — Next.js 무료 hobby plan

---

## 1. Neon — PostgreSQL + pgvector

### 1.1 프로젝트 생성
1. https://console.neon.tech → **New Project**
2. Region: `Asia Pacific (Singapore)` 권장 (한국 latency 최소)
3. PostgreSQL 버전: **16** (pgvector 공식 지원)
4. Database 이름: `drivetree`

### 1.2 pgvector 확장 활성화
마이그레이션(`backend/prisma/migrations/.../migration.sql`) 첫 줄에 `CREATE EXTENSION IF NOT EXISTS "vector"`가 포함되어 있어 `prisma migrate deploy` 시 자동 활성화. 추가 작업 불필요.

### 1.3 Connection String 복사
- Neon 콘솔 → **Dashboard** → **Connection Details** → **Pooled connection** 토글 **OFF**
- 형식: `postgresql://USER:PASSWORD@ep-xxx.ap-southeast-1.aws.neon.tech/drivetree?sslmode=require`

---

## 2. Railway — NestJS 백엔드

### 2.1 새 프로젝트 + GitHub 연동
1. https://railway.app/new → **Deploy from GitHub repo**
2. 본 레포 선택 → **Root Directory**: `backend`
3. Branch: `main`

### 2.2 환경변수 설정
Railway 프로젝트 → **Variables** 탭:

| 변수 | 값 | 비고 |
|---|---|---|
| `DATABASE_URL` | Neon connection string | 필수 |
| `JWT_SECRET` | 랜덤 문자열 32자+ | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | 랜덤 문자열 32자+ (JWT_SECRET과 **다른 값**) | 필수 |
| `SENTRY_DSN` | Sentry 프로젝트 DSN | 선택. 있으면 5xx 에러 자동 전송 |
| `ALLOWED_ORIGINS` | Vercel 도메인 | Vercel 배포 후 추가 |
| `NODE_ENV` | `production` | 필수 |
| `NEST_LOG_LEVEL` | `log,warn,error` | 권장 |
| `ADMIN_USERNAME` | 관리자 계정명 | 필수 |
| `ADMIN_PASSWORD` | 강력한 비밀번호 | 필수 |

> `PORT`는 Railway가 자동 주입하므로 입력하지 말 것.

### 2.3 빌드/배포
`backend/railway.json` 자동 인식:
- **Build**: `npm install && npx prisma generate && npm run build`
- **Start**: `npx prisma migrate deploy && node dist/src/main.js`
- **Healthcheck**: `/api`

### 2.4 공개 도메인 발급
- Railway → **Settings** → **Networking** → **Generate Domain**
- 발급된 도메인을 Vercel 환경변수에 입력

---

## 3. Vercel — Next.js 프론트엔드

### 3.1 새 프로젝트
1. https://vercel.com/new → 본 레포 선택
2. **Root Directory**: `frontend`

### 3.2 환경변수 설정

| 변수 | 환경 | 값 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Production | `https://<railway-production-domain>/api` |
| `NEXT_PUBLIC_API_URL` | Preview | `https://<railway-staging-domain>/api` |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://drivetree.vercel.app` |

---

## 4. CORS 화이트리스트 갱신

Railway `ALLOWED_ORIGINS`에 Vercel 도메인 추가:
```
https://drivetree.vercel.app
```

---

## 5. 동작 검증 체크리스트

- [ ] 메인 페이지 콘텐츠 카드 6개 표시
- [ ] 콘텐츠 상세 페이지 마크다운 렌더링
- [ ] 챗봇 → 질문 → 답변 + 출처 카드
- [ ] 범칙금/유지비 계산기 동작
- [ ] `/admin/login` → 관리자 로그인 → 대시보드 진입
- [ ] 브라우저 콘솔 CORS 에러 없음
- [ ] Railway 로그 5xx 에러 없음

---

## 6. 트러블슈팅

### "Cannot find module 'dist/src/main.js'"
Railway 빌드 로그에서 `nest build` 출력 확인. 로컬에서 `npm run build` 먼저 통과시키고 push.

### "P1001: Can't reach database server"
`DATABASE_URL` 끝에 `?sslmode=require` 확인. Neon cold start 시 첫 요청 약 5초 소요.

### CORS 에러
Railway `ALLOWED_ORIGINS`에 실제 Vercel 도메인이 정확히 입력됐는지 확인 (https:// 포함, 끝에 / 없이).

### Rate limit 429 응답
정상 동작. `/chat/ask` 분당 10회 / 시간당 60회. 필요 시 `backend/src/chat/chat.controller.ts`의 `@Throttle` 값 수정.

---

## 7. 비용 예상 (월)

| 서비스 | 플랜 | 예상 비용 |
|---|---|---|
| Neon | Free (0.5GB storage) | $0 |
| Railway | Hobby ($5/월) | $5 |
| Vercel | Hobby (100GB bandwidth) | $0 |
| **합계** | | **$5/월** |

---

## 8. AWS 풀스택 (옵션 B)

Railway/Vercel 안정화 후 별도 문서 작성 예정:
- ECS Fargate + ALB (백엔드)
- RDS PostgreSQL 16 + pgvector (DB)
- CloudFront + Vercel 또는 Amplify (프론트)
- Route 53 + ACM · CloudWatch + X-Ray
