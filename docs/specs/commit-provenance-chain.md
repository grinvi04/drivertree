# Commit provenance chain 정본 백필

## 배경

DriveTree의 커밋 메시지 검증 자산이 Team Harness 정본과 드리프트되어 있다. 최신
`develop`(`662464b78cd4ba712428f2743c327589b460ecc9`)에서 repo-sync를 실행한 결과
`OK 8 / WARN 0 / MISSING 10`이며, 그중 4건이 commit provenance chain이다.

- commitlint workflow와 config는 존재하지만 정본과 불일치한다.
- commit-msg hook과 commit message validator는 없다.

## 제품 방향 판단

**소유** — 커밋 메시지 정책, CI 증거, 로컬/서버 검증의 일치는 Team Harness가
소유하는 delivery 강제 범위다. DriveTree 고유 기능이나 실행 플랫폼 기능을
공용 하네스에 추가하지 않는다.

## 범위

Team Harness v0.61.0의 다음 정본 자산을 동일한 대상 경로에 백필한다.

1. `.github/workflows/commitlint.yml`
2. `commitlint.config.cjs`
3. `.githooks/commit-msg`
4. `scripts/check-commit-message.cjs`

이 변경은 애플리케이션 코드, 의존성, DB migration, branch protection을 수정하지
않는다. destructive-DDL chain 6건은 별도 후속 작업으로 유지한다.

## 수용 기준

1. commitlint workflow가 고정 SHA action을 사용하고 PR의 전체 commit range를
   `scripts/check-commit-message.cjs --range`로 검증한다.
2. commitlint config가 로컬 validator의 `team-harness-message` 규칙을 연결한다.
3. `.githooks/commit-msg`가 실행 가능하며 유효한 메시지는 통과시키고 위반
   메시지는 거부한다.
4. validator가 Team Harness의 한국어 제목, 필수 scope, `이유:` 본문,
   merge provenance 규칙을 검증한다.
5. 4개 자산은 Team Harness 정본과 byte-for-byte 일치한다.
6. repo-sync 결과는 `OK 12 / WARN 0 / MISSING 6`이 되며, 남은 6건은
   destructive-DDL chain으로만 구성된다.
7. backend/frontend의 기존 format, lint, test, build 게이트와 PR required checks가
   통과한다.

## TDD·검증

1. **RED** — 최신 `develop`에서 repo-sync가 commit provenance chain 4건을
   MISSING으로 보고하는지 확인한다.
2. **GREEN** — 정본 4개를 최소 변경으로 백필하고 byte equality, 구문,
   validator/hook의 유효·무효 표본을 검증한다.
3. **회귀 검증** — repo-sync의 잔여 6건을 확인하고 backend/frontend 전체
   quality 명령과 GitHub PR 게이트를 실행한다.

## 로컬 활성화

tracked 자산과 별도로 각 clone은 `git config --local core.hooksPath .githooks`로
hook을 활성화한다. 이는 repo 자산을 늘리는 변경이 아니라 clone-local 운영
설정이며, merge 후 깨끗한 로컬 clone에 적용해 실제 commit 경로를 검증한다.
