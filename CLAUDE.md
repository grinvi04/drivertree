# DriveTree — Claude Code 작업 규칙

@CLAUDE.local.md

> 백엔드 패턴 → `backend/CLAUDE.md` · 프론트엔드 패턴 → `frontend/CLAUDE.md`

---

## 코딩 전 원칙

1. **가정하지 말고 물어라** — 해석이 여러 가지면 조용히 고르지 말고 제시한다
2. **최소 코드** — 요청한 것만. 200줄이 50줄로 가능하면 다시 쓴다
3. **외과적 수정** — 내 변경이 만든 orphan만 정리. 기존 코드 손대지 않는다
4. **성공 기준 먼저** — 멀티스텝 작업은 `[단계] → 검증: [방법]` 형식으로 계획 제시

---

## 디자인 레퍼런스

UI 작업 전 반드시 읽을 것:

| 파일 | 목적 |
|---|---|
| [`DESIGN.md`](./DESIGN.md) | Apple 디자인 시스템 원본 스펙 — 색상 토큰, 타이포그래피 |
| [`DESIGN_IMPL.md`](./DESIGN_IMPL.md) | CSS 변수 매핑, 유틸리티 클래스, 체크리스트 |

---

## 커맨드 강제 사용 규칙

**`backend/src/` 또는 `frontend/src/` 파일을 수정·생성할 때는 반드시 아래 커맨드를 먼저 실행한다. 직접 편집 금지.**

| 상황 | 커맨드 |
|---|---|
| 운영 중 긴급 버그 (main 기준) | `/hotfix <name> "<증상>"` |
| 새 기능 추가 (develop 기준) | `/feature-add <name> "<설명>"` |
| 기존 기능 변경 (develop 기준) | `/feature-modify <name> "<설명>"` |
| 콘텐츠 추가 | `/content-add "<주제>" <category>` |
| 릴리즈 전 검증 | `/release-check` |
| 릴리즈 실행 | `/release <version>` |

**예외** (슬래시 커맨드 없이 직접 편집 허용 — 단, Git Flow 브랜치 규칙은 동일 적용):
- `.claude/`, `CLAUDE.md`, `README.md` 등 설정·문서
- `package.json`, `docker-compose.yml` 등 인프라 설정
- `backend/prisma/` 스키마 (`prisma migrate dev` 워크플로우 사용)

**커밋은 파일 종류와 무관하게 항상 feature/fix/hotfix/release 브랜치에서 할 것.**

**커맨드를 건너뛰고 싶으면 멈추고 사용자에게 먼저 물어볼 것.**

---

## 멀티에이전트 슬래시 커맨드

| 커맨드 | 병렬 에이전트 |
|---|---|
| `/feature-add <name> "<설명>"` | 백엔드 + 프론트엔드 |
| `/release-check` | 백엔드·프론트 품질 + 보안 + README |
| `/content-add "<주제>" <category>` | 본문 + SEO |
| `/design-qa` | Apple 토큰 준수 + WCAG 접근성 |

---

## Git Flow

| 브랜치 | 직접 커밋 |
|---|---|
| `main`, `develop` | ❌ 금지 |
| `feature/*`, `fix/*`, `hotfix/*`, `release/*` | ✅ |

**기능 개발**: `develop → feature/xxx → develop (--no-ff)`  
**긴급 수정**: `main → hotfix/xxx → main (tag) + develop (--no-ff)` ← develop 누락 금지  
**릴리즈**: `develop → release/vX.X.X → main (tag) + develop (--no-ff)`

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

- **`npm install` 사용** (not `npm ci`) — npm 10.x + wasm32 optional 패키지 lock 파일 버그
- 백엔드 수정 후 커밋 전: `cd backend && npm run format && npm run lint:check && npm test`
- 프론트 수정 후 커밋 전: `cd frontend && npm run build`
- **PostToolUse hook이 저장 시 자동 검사** — 실패하면 수정 후 재시도
