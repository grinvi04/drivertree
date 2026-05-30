# DriveTree — Claude Code 하네스 구성

DriveTree 개발 환경에서 Claude Code가 어떻게 동작하는지 설명한다.
코드 작성·검증·릴리즈까지 전 과정이 커맨드 하나로 처리된다.

---

## 전체 워크플로우

```
새 세션 시작
  └─ SessionStart hook → 브랜치·커밋·Railway·Vercel 상태 자동 주입

기능 개발
  ├─ /feature-add  → TDD: 테스트 계약 → 구현 → Refactor → 커밋
  └─ /feature-modify → TDD: 기존 테스트 갱신 → 수정 → 회귀 검사 → 커밋

파일 저장할 때마다
  └─ PostToolUse hook → prettier → lint → 타입 → 테스트 자동 실행
                        실패 시 exit 2 → Claude가 수정 후 재시도

배포
  ├─ /release-check → lint·test·빌드·e2e·보안 병렬 검증
  ├─ /release       → 스테이징 확인 → main 머지 → 태그 → 헬스 체크
  └─ /hotfix        → main 분기 → 수정 → main+develop 양쪽 머지

긴급 운영 수정
  └─ /hotfix → 회귀 테스트 작성 → 수정 → main·develop 동시 반영
```

---

## CLAUDE.md 계층

| 파일 | 역할 | 로드 시점 |
|---|---|---|
| `~/.claude/CLAUDE.md` | Karpathy 4원칙 (전역) | 모든 세션 시작 시 |
| `CLAUDE.md` | git flow, 커밋 규칙, CI 주의사항 | 모든 세션 시작 시 |
| `CLAUDE.local.md` | 로컬 URL, 개발 계정 (gitignore) | @import로 자동 포함 |
| `backend/CLAUDE.md` | NestJS 11 · Prisma 7 · Jest 패턴 | backend/ 파일 접근 시 |
| `frontend/CLAUDE.md` | Next.js 16 · React 19 · Tailwind v4 패턴 | frontend/ 파일 접근 시 |

---

## Hooks

### SessionStart — `session-start.sh`

세션 시작 시 자동 실행. 아래 정보를 Claude 컨텍스트에 주입한다:
- 현재 브랜치, 최근 커밋 3개, 미커밋 파일 수
- Railway 연결 상태 (끊겨 있으면 자동 재연결)
- Vercel 인증 상태

### PostToolUse — `validate-edit.sh`

`.ts`·`.tsx` 파일 저장 시마다 실행:

```
backend/src/**  → prettier 자동 포맷 → eslint → jest (spec 있으면)
frontend/src/** → tsc --noEmit (60초 타임아웃)
```

실패 시 `exit 2` → Claude Code가 오류를 Claude에게 전달 → 수정 반복.

### PreToolUse — `guard-dangerous.sh`

실행 전 차단:
- `git push --force` to main/develop
- `prisma migrate reset`
- 프로젝트 핵심 디렉터리 `rm -rf`
- `git reset --hard`

### SubagentStop / Stop

- **SubagentStop**: 병렬 에이전트 완료 시 조용한 macOS 배너
- **Stop**: 전체 작업 완료 시 Glass 사운드 알림

---

## Slash Commands

### 개발

| 커맨드 | 흐름 |
|---|---|
| `/feature-add <name> "<설명>"` | Phase 0(중복 확인) → Phase 1(영향 범위) → Phase 2(spec 작성·RED) → Phase 3(백엔드 구현·GREEN) ‖ Phase 4(프론트 구현) → Phase 5(Refactor) → Phase 6(e2e·커밋) |
| `/feature-modify <name> "<설명>"` | Phase 0(spec 확인) → Phase 1(영향 분석) → Phase 2(spec 갱신·RED) → Phase 3(수정·회귀 검사) → Phase 4(프론트 수정) → Phase 5(Refactor) → Phase 6(e2e·커밋) |

두 커맨드 모두 **TDD Red→Green→Refactor** 흐름. 테스트가 구현보다 먼저 존재한다.

### 릴리즈

| 커맨드 | 역할 |
|---|---|
| `/release-check` | 백엔드 품질·프론트 품질·보안 3개 에이전트 병렬 검증. 모두 ✅이면 README 자동 최신화 |
| `/release <version>` | 스테이징 헬스 체크 → 최종 검증 → main 머지·태그 → Railway·Vercel 배포 대기 → 프로덕션 헬스 체크 |
| `/hotfix <name> "<증상>"` | main에서 분기 → 회귀 테스트 작성(RED) → 수정(GREEN) → main·develop **양쪽** 머지 |

### 보조

| 커맨드 | 역할 |
|---|---|
| `/init` | NEXT_STEPS.md·git 상태·테스트 결과 브리핑 |
| `/content-add "<주제>" <category>` | 가이드 콘텐츠 본문 + SEO 병렬 생성 |
| `/design-qa` | Apple 디자인 토큰 준수 + WCAG 접근성 병렬 검토 |

---

## 조건부 Rules

`.claude/rules/`에 정의. 해당 파일 접근 시에만 로드된다.

| 파일 | 적용 경로 | 내용 |
|---|---|---|
| `prisma.md` | `backend/prisma/**`, `backend/src/**` | 마이그레이션 안전 순서, 금지 패턴 |
| `ci.md` | `.github/workflows/**` | npm install vs ci, 브랜치별 배포 동작 |

---

## MCP

| 서버 | 범위 | 용도 |
|---|---|---|
| GitHub MCP | user scope | 이슈·PR·코드 검색 |
| Vercel plugin | 전역 | 배포 상태·환경변수 관리 |

GitHub MCP는 `~/.claude/mcp-wrappers/github.sh` 래퍼를 통해 `gh auth token`으로 토큰을 동적 주입한다. 토큰 하드코딩 없음.

---

## 보안 설계

- `ADMIN_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET` — 환경변수 필수, 하드코딩 없음
- `.env` 파일 — `.gitignore` 3중 차단
- `dangerouslySetInnerHTML` — `isomorphic-dompurify` sanitize 후에만 허용
- `$queryRaw`/`$executeRaw` — `Prisma.sql` 템플릿 리터럴만 허용
- `settings.local.json` deny 규칙 — `backend/.env`, `frontend/.env.local` 직접 읽기 차단

---

## 배포 구성

```
develop 브랜치 push → Railway Staging 자동 배포
main 브랜치 push    → Railway Production + Vercel Production 자동 배포
```

| 환경 | 프론트 | 백엔드 |
|---|---|---|
| Local | localhost:3000 | localhost:4000 |
| Staging | Vercel Preview | drivertree-staging.up.railway.app |
| Production | drivertree.vercel.app | drivertree-production.up.railway.app |
