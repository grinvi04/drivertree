# 의사결정 기록 (Decision Log)

이 프로젝트의 확정된 기술·프로세스 결정과 **비자명한 도메인 지식**의 단일 출처.
"무엇이 왜 이렇게 됐나"를 한 곳에 — 로컬 AI 메모리가 아니라 여기 누적한다(다른 PC·세션·사람이 보게).
(공통 정책: team-harness `ai-collaboration.md` — 결정·지식은 repo docs, 로컬 메모리 최소.)

## 규약
- 새 결정 확정 시 이 표에 행 추가(영향 문서 갱신을 같은 PR에서).
- 결정 변경 시 행을 지우지 않고 상태를 `대체됨(→新행)`으로 — 이력 보존.

## 결정 목록

| 결정 | 시점 | 정본/관련 |
|---|---|---|
| **`npm ci` 사용**(`npm install` 금지) — 2026-06-09 클린 재생성 fix 이후 표준. `npm install`은 incremental drift를 마스킹 | 2026-06-09 | AGENTS.md, CLAUDE.md |
| **Git Flow**: main·develop 직접 커밋 금지(어떤 긴급도 예외 없음). feature/fix/hotfix/release→PR. main 기반 hotfix, develop 기반 feature | 2026-06 | AGENTS.md |
| 커밋 전 검사: 백엔드 `cd backend && npm run format && npm run lint:check && npm test`, 프론트 `cd frontend && npm run build`. PostToolUse 훅이 저장 시 자동 검사 | 2026-06 | AGENTS.md, CLAUDE.md |
| 배포: 백엔드 Railway · 프론트 Vercel · DB Neon. 배포 검증은 liveness만 보지 말고 freshness(최신 배포=릴리즈 커밋)까지 — `railway/vercel/neonctl` CLI로 | 2026-06 | AGENTS.md(배포·헬스체크) |
| `backend/prisma/` 스키마는 `prisma migrate dev` 워크플로로 변경(마이그레이션 forward-only) | 2026-06 | CLAUDE.md |

> 위는 기존 CLAUDE.md·AGENTS.md의 핵심 결정을 시드로 이관한 것. 새 설계 결정·도메인 지식은 여기 계속 누적한다.
