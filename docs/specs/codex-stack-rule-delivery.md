# Codex stack rule 전달 스펙 (#74)

## 1. 목표 & Why

DriveTree의 실제 스택 규칙을 Claude Code의 자동 로딩 경로와 Codex의 명시적 로딩 경로가 같은 원문에서
읽도록 연결한다. **성공 기준(측정 가능): Team Harness v0.61.0 repo-sync가 stack-rule pointer와 감지된
TypeScript·Next.js·Prisma rule 3종을 모두 `OK`로 판정하고 기존 제품 품질 게이트가 통과한다.**

## 2. Scope

- **In:** `AGENTS.md`의 Stack Rule 전달 계약, `.claude/rules/typescript.md`,
  `.claude/rules/nextjs.md`, `.claude/rules/prisma.md`, 재현 가능한 repo-sync·품질 검증 증거.
- **Out (Non-goals):** commitlint 정본 체인, destructive-DDL 게이트, 제품 런타임 코드, package 의존성,
  사용자 전역 설정, split package·marketplace 승격.

## 3. 기능 요구사항 + 수용기준

- **AC-1 (전달):** WHEN AI 도구가 TypeScript·Next.js·Prisma 관련 작업을 시작하면, the repository SHALL
  `AGENTS.md`에서 관련 `.claude/rules/*.md` 원문을 먼저 읽도록 요구한다.
- **AC-2 (정본):** WHEN Team Harness v0.61.0 정본과 DriveTree의 stack rule을 비교하면, the repository SHALL
  TypeScript·Next.js·Prisma 규칙을 byte-equivalent하게 보유한다.
- **AC-3 (드리프트):** WHEN Team Harness v0.61.0 repo-sync를 현재 checkout에 실행하면, the system SHALL
  stack-rule pointer와 rule 3종을 `OK`로 판정하고 `WARN`을 0으로 줄인다.
- **AC-4 (범위):** WHILE 이번 백필만 적용된 상태에서, the system SHALL 나머지 MISSING 10개를 별도
  드리프트로 그대로 보고하고 성공으로 은폐하지 않는다.
- **AC-5 (회귀):** WHEN 저장소 품질 검증을 실행하면, the system SHALL backend format/lint/build/unit과
  frontend format/lint/unit/build를 모두 exit 0으로 완료한다.

## 4. 제약 / 비기능

- Team Harness v0.61.0의 기록된 정본 파일을 그대로 복사하며 개인 경로·시크릿을 추가하지 않는다.
- 제품 동작과 배포 surface는 변경하지 않는다.

## 5. 경계 / Do-Not

- ✅ 해도 됨: 문서 pointer 추가, 정본 stack rule 3개 백필, 읽기 전용 검증.
- ⚠️ 먼저 물어봐: commitlint·DDL 게이트까지 같은 PR로 확장, 사용자 전역 plugin 상태 변경.
- 🚫 절대 금지: 제품 코드 변경, 시크릿 기록, 가드·CI 완화, main/develop 직접 커밋·push.

## 6. Open Questions

없음. 사용자가 기록된 다음 작업의 진행을 승인했고, 가장 작은 적용 가능한 백로그로 #74를 선택했다.

## 7. 기술 접근 (HOW)

- `templates/AGENTS.md`의 Stack Rule 전달 문단을 DriveTree `AGENTS.md`에 외과적으로 추가한다.
- Team Harness v0.61.0의 `templates/rules/stacks/{typescript,nextjs,prisma}.md`를 동일 경로의
  `.claude/rules/`로 복사한다.
- 변경 전 repo-sync의 `OK 4 / WARN 3 / MISSING 11`을 RED 증거로, 변경 후
  `OK 8 / WARN 0 / MISSING 10`과 byte 비교를 GREEN 증거로 사용한다.
- 런타임 코드가 변하지 않아 제품 테스트를 새로 만들지 않고 기존 품질 게이트 전체로 회귀를 검증한다.

## 8. 태스크 (test-first 순서)

| # | 태스크 | AC 참조 | 대상 파일 | 검증/판정 결과 | 의존 | [P] |
|---|---|---|---|---|---|---|
| 1 | stack-rule 전달 계약과 정본 rule 3종 백필 | AC-1~AC-4 | `AGENTS.md`, `.claude/rules/*.md`, 이 스펙 | `node /path/to/team-harness/plugins/harness-guard/scripts/check-repo-sync.mjs --repo .`는 잔여 MISSING으로 exit 1이되 pointer·rule 3종 `OK`, `WARN 0` | — | |
| 2 | 제품 품질 회귀 검증 | AC-5 | 변경 없음 | backend `format:check`, `lint:check`, `build`, `test`; frontend `format:check`, `lint`, `test:unit`, `build` | #1 | |

Task 1은 스펙과 전달 자산을 한 원자적 커밋으로 되돌릴 수 있다. Task 2는 검증 전용이며 새 커밋을 만들지 않는다.
