# DriveTree — Claude Code 작업 규칙

@CLAUDE.local.md

> 백엔드 패턴 → `backend/CLAUDE.md` · 프론트엔드 패턴 → `frontend/CLAUDE.md`

---


## 디자인 레퍼런스

UI 작업 전 반드시 읽을 것:

| 파일 | 목적 |
|---|---|
| [`DESIGN.md`](./DESIGN.md) | Apple 디자인 시스템 원본 스펙 — 색상 토큰, 타이포그래피 |
| [`DESIGN_IMPL.md`](./DESIGN_IMPL.md) | CSS 변수 매핑, 유틸리티 클래스, 체크리스트 |

---

## Claude Code 전용 지침

- git-flow 작업은 harness-guard 플러그인 커맨드 사용: `/feature-merge`, `/hotfix`, `/release-check`, `/release` (그 외 `/feature-add`, `/feature-modify`, `/content-add`, `/design-qa`, `/work-plan` 제공)
- PR 머지 전 게이트는 `pr-review-gate` 스킬 절차를 따른다 (단일 출처)
- 릴리즈 전 보안 검토는 `security-reviewer` 에이전트를 spawn한다
- `main`·`develop` 직접 커밋 금지, PR·승인·CI 통과 강제는 GitHub branch protection이 담당한다 (아래 Git Flow 참조)
- `backend/prisma/` 스키마는 `prisma migrate dev` 워크플로우로 변경한다 (마이그레이션은 forward-only)

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

## CI 주의사항

- **`npm ci` 사용** — 2026-06-09 클린 재생성 fix 이후 표준. `npm install`은 incremental drift를 마스킹함
- 백엔드 수정 후 커밋 전: `cd backend && npm run format && npm run lint:check && npm test`
- 프론트 수정 후 커밋 전: `cd frontend && npm run build`
- **PostToolUse hook이 저장 시 자동 검사** — 실패하면 수정 후 재시도

---

## Compact Instructions

컨텍스트 압축 후에도 반드시 유지해야 할 핵심 규칙:

1. **Git Flow**: `main`, `develop` 직접 커밋 금지 (branch protection으로 강제). feature/fix/hotfix/release 브랜치 → PR 경유.
2. **`npm ci` 사용** — 2026-06-09 fix 이후 표준. `npm install` 사용 금지.
3. **커밋 전 검사**: 백엔드 `cd backend && npm run format && npm run lint:check && npm test`, 프론트 `cd frontend && npm run build`.
