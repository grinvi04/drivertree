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
| `feat` · `fix` · `refactor` · `perf` | 코드 의미 변경 — scope와 `이유:` 본문 필수 |
| `test` | 테스트 변경 — scope 필수 |
| `docs` · `style` · `chore` · `ci` · `build` · `revert` | 문서·스타일·설정·CI·빌드·되돌리기 |

`hotfix/*`는 브랜치·workflow 유형이며 커밋은 `fix(scope): 한국어 제목`과
`이유:` 본문을 사용한다.

---

## 빌드·테스트 명령

- 백엔드 품질 검사: `cd backend && npm run format:check && npm run lint:check && npm run build && npm test && npm run test:e2e`
- 프론트 품질 검사: `cd frontend && npm run format:check && npm run lint && npm run test:unit && npm run build && npm run test:e2e`
- `format`과 `lint --fix`는 수정 명령이다. 검증에는 `format:check`와 `lint:check`를 사용한다.
- 백엔드 테스트만: `cd backend && npm test`
- 프론트 빌드: `cd frontend && npm run build`
- 프론트 단위 테스트: `cd frontend && npm run test:unit` (vitest + @testing-library/react)
- 프론트 e2e: `cd frontend && npm run test:e2e` (Playwright)
- **`npm ci` 사용** — 2026-06-09 클린 재생성 fix 이후 표준. `npm install`은 incremental drift를 마스킹함
- **PostToolUse hook이 저장 시 자동 검사** — 실패하면 수정 후 재시도

## 문서 관리

> **이 repo의 프로젝트 상태는 repo/GitHub에 둔다.** 플랜·스펙은 `docs/specs/`, 백로그·할 일은 GitHub Issues + Milestone(`/milestone`), 작업로그는 git 히스토리 + CHANGELOG/릴리즈노트, 설계 결정·도메인 지식은 `docs/decisions.md`에 기록한다. **도구 로컬 AI 메모리(예: `~/.claude` 메모리)에 프로젝트 상태·백로그·작업로그·결정·도메인 지식을 두지 않는다**(다른 PC·세션·사람이 못 보고 유실). 로컬 메모리는 팀 공유 불필요한 *개인 작업습관*에만 최소로. (정본: `ai-collaboration.md`)

## QA 범위와 완료 기준

- 구현·시험 전에 기존 스펙에 요구·위험 → 필수 정상/거부/실패/경계 사례 → 기대값과 관찰 경계 → 명령·환경을 연결한다. 테스트 개수나 파일 존재로 완료를 판정하지 않는다.
- 기존 [품질 로드맵](docs/specs/quality-remediation.md)의 현재 후보·검증 표를 재사용한다. API 오류, 실DB CRUD·소프트삭제·챗 폴백, 브라우저 흐름은 각 관찰 경계를 구분한다. 브라우저 API 대역의 성공을 실제 DB·권한 성공으로 확대하지 않는다.
- 시험 전 DB가 이번 작업의 격리된 loopback fixture인지 확인한다. 통합 시험은 전체 행을 정리하므로 기존 로컬/운영 DB에 실행하지 않는다. 운영 키·외부 Gemini 호출을 사용하지 않는다.
- 증거에는 cwd·후보 SHA/미커밋 diff·명령·종료 코드·최초 실패와 재시도 조건을 남긴다. PASS/FAIL/UNVERIFIED/SKIP을 구분하고 미실행은 UNVERIFIED, 실제 비적용만 SKIP이다. 필수 flaky·실패·미확인이 남으면 완료 금지다.
- 완료는 선정한 필수 범위 모두 PASS, 범위 내 차단 결함 0, 같은 후보의 제품 품질/원격 gate·필요한 독립 검토, 문서 상태 일치가 함께 필요하다. 구현·로컬 검증·병합·검사 활성화·배포를 별도로 보고한다.

## Markdown 동기화 완료 기준

- 변경 시작 시 관련 스펙·체크리스트·사용 안내를 확인하고 실제 변경·검증·진행 상태와 다음 행동을 같은 작업에서 갱신한다. 오래된 현재 안내가 남으면 완료로 판정하지 않는다.
- 과거 기록은 당시 후보·실패·한계를 보존하고 최신 상태로 연결한다. PR/이슈에 갱신 문서와 상태 근거를 연결하며 영향이 없으면 이유를 남긴다.
- 완료 전에 참조 경로·명령·후보·완료/미완료 표현을 대조한다. 재사용 체크리스트를 실제 진행 백로그로 세지 않는다.

## Stack Rule 전달

- 작업 대상 stack과 관련된 `.claude/rules/*.md`를 작업 전에 읽는다. 이 경로는 Claude Code의 자동 로딩
  위치이지만 rule 원문은 도구 공통이다. Codex/Gemini는 AGENTS의 이 지시에 따라 관련 파일을 명시적으로 읽는다.

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
