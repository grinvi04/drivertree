# AGENTS.md — DriveTree 작업 규약 (AI 도구 공통)

> 이 파일은 모든 AI 코딩 도구의 단일 규약 출처다.
> Claude Code는 CLAUDE.md의 `@AGENTS.md` import로 이 파일을 읽는다.

## 디자인 레퍼런스

UI 작업 전 반드시 읽을 것:

| 파일 | 목적 |
|---|---|
| [`DESIGN.md`](./DESIGN.md) | Apple 디자인 시스템 원본 스펙 — 색상 토큰, 타이포그래피 |
| [`DESIGN_IMPL.md`](./DESIGN_IMPL.md) | CSS 변수 매핑, 유틸리티 클래스, 체크리스트 |

---

## Git Flow

| 브랜치 | 직접 커밋 |
|---|---|
| `main`, `develop` | ❌ **절대 금지 — 배포 크래시, 긴급 버그 등 어떤 상황도 예외 없음** |
| `feature/*`, `fix/*`, `hotfix/*`, `release/*` | ✅ |

**기능 개발**: `develop → feature/xxx → PR → develop`
**긴급 수정**: `develop → fix/xxx → PR → develop` (배포 중 버그, 마이그레이션 누락 등 포함)
**운영 핫픽스**: `main → hotfix/xxx → PR → main (tag) + develop`
**릴리즈**: `develop → release/vX.X.X → PR → main (tag) + develop`

> ⛔ "빠르게 해야 한다", "작은 수정이다", "긴급하다" — 모두 브랜치를 건너뛸 이유가 되지 않는다.

---

## 커밋 메시지 (한국어)

```
타입(범위): 제목          ← 50자 이내

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

| 타입 | 의미 |
|---|---|
| `feat` | 새 기능 · `fix` 버그 · `hotfix` 긴급 · `refactor` 개선 |
| `test` | 테스트 · `docs` 문서 · `chore` 빌드/설정 · `ci` CI/CD |

---

## 빌드·테스트 명령

- 백엔드 품질(format·lint·test): `cd backend && npm run format && npm run lint:check && npm test`
- 백엔드 테스트만: `cd backend && npm test`
- 프론트 빌드: `cd frontend && npm run build`
- 프론트 단위 테스트: `cd frontend && npm run test:unit` (vitest + @testing-library/react)
- 프론트 e2e: `cd frontend && npm run test:e2e` (Playwright)
- **`npm ci` 사용** — 2026-06-09 클린 재생성 fix 이후 표준. `npm install`은 incremental drift를 마스킹함
- **PostToolUse hook이 저장 시 자동 검사** — 실패하면 수정 후 재시도

## 문서 관리

> **생성 문서는 repo에 커밋한다.** AI 도구가 만든 계획·설계 문서(`/plan` 스펙, `/milestone` 추적, 설계 결정 기록 등)는 도구 로컬 디렉터리(예: `~/.claude/plans`)에 두지 말고 프로젝트 `docs/` 아래에 커밋해 관리한다. 로컬 캐시는 노트북·도구·세션이 바뀌면 유실된다 — repo에 있어야 누가·어디서 이어받아도 일관되게 작업할 수 있다. (공통 규칙 단일 출처: team-harness `ai-collaboration.md`.)

## 배포·헬스체크

| 환경 | 백엔드(Railway) | 프론트(Vercel) | DB(Neon) |
|---|---|---|---|
| Production | `https://drivertree-production.up.railway.app` | `https://drivertree.vercel.app` | DriverTree / production |
| Staging | `https://drivertree-staging.up.railway.app` | (Vercel preview) | DriverTree / staging |

- 백엔드 헬스: `curl -sf https://drivertree-production.up.railway.app/api/health` (200)
- 프론트 헬스: `curl -sf -o /dev/null -w "%{http_code}" https://drivertree.vercel.app`

**배포 신선도** (team-harness `operations.md` §6 — liveness ≠ freshness): 200만 보지 말고 최신 배포가 릴리즈 커밋과 일치하는지 확인.
- `railway deployment list` (최신 SUCCESS commit = 방금 릴리즈) · `vercel ls drivertree` · `neonctl branches list --project-id weathered-breeze-14664744`(ready)
- 배포 정체 시: ① 연결 브랜치(prod→main) ② **계정 리소스/크레딧 한도** ③ GitHub 웹훅 순 점검
