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
- 프론트 e2e: `cd frontend && npm run test:e2e` (Playwright) — 프론트 단위 테스트 러너는 미설정
- **`npm ci` 사용** — 2026-06-09 클린 재생성 fix 이후 표준. `npm install`은 incremental drift를 마스킹함
- **PostToolUse hook이 저장 시 자동 검사** — 실패하면 수정 후 재시도
