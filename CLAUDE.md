# DriveTree — Claude Code 작업 규칙

@AGENTS.md
@CLAUDE.local.md

> 백엔드 패턴 → `backend/CLAUDE.md` · 프론트엔드 패턴 → `frontend/CLAUDE.md`
> 프로젝트 공통 규약(디자인·Git Flow·커밋·CI)은 `AGENTS.md` 참조

---

## Claude Code 전용 지침

- git-flow 작업은 harness-guard 플러그인 커맨드 사용: `/feature-merge`, `/hotfix`, `/release-check`, `/release` (그 외 계획 `/plan`, 개발 `/feature-add`·`/feature-modify`·`/qa`, repo 로컬 `/content-add` 제공)
- PR 머지 전 게이트는 `pr-review-gate` 스킬 절차를 따른다 (단일 출처)
- 릴리즈 전 보안 검토는 `security-reviewer` 에이전트를 spawn한다
- `main`·`develop` 직접 커밋 금지, PR·승인·CI 통과 강제는 GitHub branch protection이 담당한다 (Git Flow는 `AGENTS.md` 참조)
- `backend/prisma/` 스키마는 `prisma migrate dev` 워크플로우로 변경한다 (마이그레이션은 forward-only)

---

## Compact Instructions

컨텍스트 압축 후에도 반드시 유지해야 할 핵심 규칙:

1. **Git Flow**: `main`, `develop` 직접 커밋 금지 (branch protection으로 강제). feature/fix/hotfix/release 브랜치 → PR 경유.
2. **`npm ci` 사용** — 2026-06-09 fix 이후 표준. `npm install` 사용 금지.
3. **커밋 전 검사**: 백엔드 `cd backend && npm run format && npm run lint:check && npm test`, 프론트 `cd frontend && npm run build`.
