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

## 커맨드 강제 사용 규칙

> **모든 작업 시작 전**: 어떤 슬래시 커맨드를 사용할지 먼저 선언하고 사용자 확인을 받을 것. 파일 종류·작업 크기와 무관하게 예외 없음.

**파일 수정·생성·삭제 및 git 작업 전에 반드시 아래 커맨드를 먼저 실행한다.**

| 상황 | 커맨드 |
|---|---|
| 운영 중 긴급 버그 (main 기준) | `/hotfix <name> "<증상>"` |
| 배포 중 버그·긴급 수정 (develop 기준) | `/feature-modify <name> "<설명>"` → fix/* 브랜치 사용 |
| 새 기능 추가 (develop 기준) | `/feature-add <name> "<설명>"` |
| 기존 기능 변경 (develop 기준) | `/feature-modify <name> "<설명>"` |
| feature 브랜치 → develop 머지 | `/feature-merge` |
| 콘텐츠 추가 | `/content-add "<주제>" <category>` |
| 릴리즈 전 검증 | `/release-check` |
| 릴리즈 실행 | `/release <version>` |
| 추적되는 인프라 파일 변경 (`package.json`, `docker-compose.yml` 등) | `/feature-modify <name> "<설명>"` |
| `.claude/` 커맨드·훅 변경 | 슬래시 커맨드·PR 불필요 (`.gitignore`로 Git 추적 제외) — harness 원본(로컬 체크아웃, 예: `~/project/harness`) 수정 후 직접 동기화 |
| 작업 계획 수립 | `/work-plan "<설명>"` |

**예외 (파일 편집에만 해당 — git 작업은 예외 없이 커맨드 필수)**:
- `CLAUDE.md`, `README.md`, `package.json`, `docker-compose.yml` 등 **추적 파일**은 슬래시 커맨드 없이 편집하되, 커밋·PR은 아래 git 규칙을 따른다
- `backend/prisma/` 스키마 (`prisma migrate dev` 워크플로우 사용)
- `.claude/`는 `.gitignore`에 의해 Git 추적에서 제외되므로 로컬 직접 편집은 해당 환경에만 반영되며 Git 커밋이 불가능하다. 따라서 커맨드/훅 변경은 반드시 harness 원본 수정 후 동기화해야 한다
- 단, **추적 파일**의 브랜치 생성·커밋·머지는 반드시 위 커맨드를 통할 것. 직접 git 명령 금지.

**커밋은 파일 종류와 무관하게 항상 feature/fix/hotfix/release 브랜치에서 할 것.**

**커맨드가 없거나 불명확하면 멈추고 사용자에게 먼저 물어볼 것. 임의로 판단하지 말 것.**

---

## 슬래시 커맨드 목록

슬래시 커맨드: `/work-plan`, `/feature-add`, `/feature-modify`, `/feature-merge`, `/hotfix`, `/content-add`, `/design-qa`, `/release-check`, `/release`, `/init`

| 커맨드 | 용도 | 병렬 에이전트 |
|---|---|---|
| `/work-plan "<설명>"` | 작업 계획 수립 | — |
| `/feature-add <name> "<설명>"` | 새 기능 추가 | 백엔드 + 프론트엔드 |
| `/feature-modify <name> "<설명>"` | 기존 기능 변경 | 백엔드 + 프론트엔드 |
| `/feature-merge` | feature → develop 머지 | — |
| `/hotfix <name> "<증상>"` | 긴급 버그 수정 | — |
| `/content-add "<주제>" <category>` | 콘텐츠 추가 | 본문 + SEO |
| `/design-qa` | 디자인 검증 | Apple 토큰 준수 + WCAG |
| `/release-check` | 릴리즈 전 검증 | 백엔드·프론트 품질 + 보안 + README |
| `/release <version>` | 릴리즈 실행 | — |
| `/init` | 프로젝트 초기화·현황 파악 | — |

### ⛔ 커맨드 우회 금지

커맨드를 실행할 때는 커맨드 파일의 Phase 순서, 서브에이전트 spawn, 검증 게이트를 정확히 따른다.

- 사용자가 `/command-name`을 입력하거나 자연어로 요청하면 Claude가 커맨드를 실행한다
- 커맨드 파일을 직접 읽고 임의로 재해석하거나 단계를 생략해서는 안 된다
- 해당 커맨드가 존재하는데 Bash로 직접 우회하는 것은 하네스 위반이다

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

1. **슬래시 커맨드 강제**: 파일 수정·git 작업 전 반드시 해당 커맨드 선언 후 사용자 확인. 예외 없음.
2. **Git Flow**: `main`, `develop` 직접 커밋 절대 금지. 반드시 feature/fix/hotfix/release 브랜치 → PR 경유.
3. **커맨드 우회 금지**: 커맨드 파일의 Phase 순서·서브에이전트·검증 게이트를 정확히 따른다. Bash 직접 우회 금지.
4. **`npm ci` 사용** — 2026-06-09 fix 이후 표준. `npm install` 사용 금지.
5. **커밋 전 검사**: 백엔드 `cd backend && npm run format && npm run lint:check && npm test`, 프론트 `cd frontend && npm run build`.
