# DriveTree — CI/CD 파이프라인 가이드

## 1. 전체 흐름

```
로컬 개발
  │  npm test + npm run lint + npm run build 통과 확인 후 push
  ▼
feature/* / fix/* 브랜치
  │  GitHub Actions: lint → build → test (품질 게이트)
  │  배포 없음
  ▼
develop 브랜치 (PR merge)
  │  GitHub Actions: lint → build → test
  │  Railway Staging 자동 배포 ──▶ https://drivetree-staging-XXXX.up.railway.app
  │  Vercel Preview 자동 생성  ──▶ https://drivetree-git-develop-XXXX.vercel.app
  ▼
main 브랜치 (PR merge, git flow release)
  │  GitHub Actions: lint → build → test
  │  Railway Production 자동 배포 ──▶ https://drivetree-production-XXXX.up.railway.app
  │  Vercel Production 자동 배포  ──▶ https://drivetree.vercel.app
```

## 2. 브랜치 전략 (Git Flow)

| 브랜치 | 목적 | CI | 배포 대상 |
|---|---|---|---|
| `main` | 운영 릴리즈 | ✅ lint + build + test | Railway Production + Vercel Production |
| `develop` | 통합 / 스테이징 | ✅ lint + build + test | Railway Staging + Vercel Preview |
| `feature/*` | 신규 기능 | ✅ lint + build + test | 없음 |
| `fix/*` | 버그 수정 | ✅ lint + build + test | 없음 |
| `hotfix/*` | 긴급 운영 수정 | ✅ lint + build + test | 없음 (수동 merge 후 main 배포) |
| `release/*` | 릴리즈 준비 | ✅ lint + build + test | 없음 |

> `main`과 `develop`에 직접 push 금지. 반드시 PR 또는 git flow 절차를 거친다.

## 3. 로컬 검증 체크리스트 (push 전 필수)

```bash
# 백엔드
cd backend
npm run format        # prettier 포맷 (CI lint:check 전 필수)
npm run lint:check    # ESLint 오류 0개 확인
npm run build         # TypeScript 컴파일 오류 0개 확인
npm test              # 단위 테스트 전체 통과 확인

# 프론트엔드
cd frontend
npm run lint          # ESLint 경고 0개 확인
npm run build         # Next.js 프로덕션 빌드 오류 0개 확인
```

> 이 중 하나라도 실패하면 CI도 실패한다. 로컬에서 먼저 잡는다.

## 4. GitHub Environments 설정

GitHub Actions에서 `staging` / `production` 환경 레이블을 사용한다.
레포 → **Settings → Environments** 에서 다음을 설정:

### 4.1 `staging` 환경
- Environment name: `staging`
- Protection rules: 없음 (자동 통과)
- Environment URL: `https://drivetree-staging-XXXX.up.railway.app` (Railway staging 도메인)

### 4.2 `production` 환경
- Environment name: `production`
- Protection rules: **Required reviewers** 1명 추가 권장 (본인 계정이라도 의도적 승인 강제)
- Environment URL: `https://drivetree.vercel.app`

## 5. Railway — Staging 서비스 추가

> 이미 Production 서비스가 있다고 가정. 동일 Railway 프로젝트에 서비스 하나 추가.

1. Railway 프로젝트 대시보드 → **+ New** → **GitHub Repo**
2. 동일 레포 선택 → **Root Directory**: `backend`
3. **Branch**: `develop` ← 핵심. production은 `main`, staging은 `develop`
4. **Variables** 탭에서 아래 환경변수 설정:

| 변수 | 값 | 비고 |
|---|---|---|
| `DATABASE_URL` | Neon staging branch connection string | 아래 5.1 참고 |
| `JWT_SECRET` | production과 **다른** 값 사용 | `openssl rand -base64 32` |
| `GEMINI_API_KEY` | (선택) production과 동일 키 사용 가능 | 비워두면 로컬 폴백 |
| `ALLOWED_ORIGINS` | Vercel develop preview URL | `https://drivetree-git-develop-*.vercel.app` |
| `NODE_ENV` | `staging` |  |

5. **Settings → Networking → Generate Domain** → staging 도메인 발급
6. 발급된 도메인을 GitHub Environment URL (`staging`)에 입력

### 5.1 Neon — Staging Branch 생성
Neon은 Git처럼 DB 브랜치를 지원한다. Production DB를 건드리지 않고 staging 데이터를 분리할 수 있다.

1. Neon 콘솔 → 해당 프로젝트 → **Branches** → **+ New Branch**
2. Branch name: `staging`
3. Branch from: `main` (production 스키마 그대로 복사, 데이터는 선택)
4. **Connection Details**에서 staging branch connection string 복사
5. Railway staging 서비스의 `DATABASE_URL`에 입력

> staging DB는 실험적인 마이그레이션이나 시드 변경을 먼저 검증하는 용도.

## 6. Vercel — Develop 브랜치 Preview 설정

Vercel은 기본적으로 `main` 외 모든 브랜치를 **Preview 배포**로 자동 처리한다.
`develop` push 시 `https://drivetree-git-develop-XXXX.vercel.app` URL이 자동 생성된다.

추가로 해야 할 일:

1. Vercel 프로젝트 → **Settings → Environment Variables**
2. `NEXT_PUBLIC_API_URL` 변수에 **Preview** 환경 추가:
   - Environment: `Preview`
   - Value: `https://drivetree-staging-XXXX.up.railway.app/api` (Railway staging 도메인)
3. Production 환경의 `NEXT_PUBLIC_API_URL`은 Railway production 도메인 유지

이렇게 하면 Vercel preview 배포가 자동으로 Railway staging 백엔드를 바라본다.

## 7. 브랜치 보호 규칙 설정 (GitHub Branch Protection)

레포 → **Settings → Branches → Add branch protection rule**

### `main` 보호
- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require status checks to pass: `Backend — lint · build · test`, `Frontend — lint · build`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

### `develop` 보호
- Branch name pattern: `develop`
- ✅ Require a pull request before merging
- ✅ Require status checks to pass: `Backend — lint · build · test`, `Frontend — lint · build`

> 이 규칙을 적용하면 CI가 실패한 브랜치는 `develop`이나 `main`에 merge 불가.

## 8. 전체 환경 URL 정리

| 환경 | 프론트엔드 | 백엔드 | DB |
|---|---|---|---|
| **Local** | `http://localhost:3000` | `http://localhost:4000` | Local PostgreSQL |
| **Staging** | Vercel Preview URL | Railway Staging URL | Neon `staging` branch |
| **Production** | `https://drivetree.vercel.app` | Railway Production URL | Neon `main` branch |

## 9. 배포 트리거 요약

| 이벤트 | CI 실행 | 배포 |
|---|---|---|
| `feature/*` push | ✅ | 없음 |
| `develop` PR open | ✅ | 없음 |
| `develop` merge | ✅ | Staging 자동 배포 |
| `main` PR open | ✅ | 없음 |
| `main` merge | ✅ | Production 자동 배포 |

## 10. 장애 대응

### staging에서 실패 → main 올리지 않는다
staging 배포 후 동작 이상이 있으면 해당 커밋을 `develop`에서 `revert`하거나 `fix/*` 브랜치로 수정 후 재 merge.

### production에서 긴급 수정이 필요할 때 (hotfix)
```bash
git checkout -b hotfix/xxx main
# 수정 작업
git checkout main && git merge --no-ff hotfix/xxx && git tag vX.X.X
git checkout develop && git merge --no-ff hotfix/xxx
git branch -d hotfix/xxx
git push origin main develop --tags
```
