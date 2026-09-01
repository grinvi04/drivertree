# Destructive-DDL chain 정본 백필

## 배경

DriveTree 최신 `develop`(`ac913922860b56a2efd9290542ffc6a4fc7bcc1a`)에서
Team Harness v0.61.0 repo-sync를 실행한 결과는
`OK 12 / WEAK 0 / WARN 0 / MISSING 6`이다. 잔여 6건은 SQL, Alembic,
ActiveRecord migration의 파괴적 DDL을 차단하는 workflow와 검사기 체인이다.

canonical 검사기를 현재 migration에 사전 적용하면 Prisma SQL 3개는 통과하고,
Alembic/ActiveRecord는 지문 없음으로 self-skip한다.

## 제품 방향 판단

**소유** — migration의 비가역 데이터 손실 정책, CI 증거, GitHub required check는
Team Harness가 소유하는 delivery 강제 범위다. 앱 도메인이나 실행 플랫폼 기능을
공용 하네스에 추가하지 않는다.

## 범위

Team Harness v0.61.0의 다음 정본 자산을 동일한 대상 경로에 백필한다.

1. `.github/workflows/destructive-ddl.yml`
2. `scripts/check-destructive-ddl.mjs`
3. `scripts/check-alembic-destructive-ddl.mjs`
4. `scripts/check-activerecord-destructive-ddl.mjs`

merge 후 기존 branch protection의 모든 설정과 context를 보존하며
`destructive-ddl` context만 main/develop에 추가한다.

애플리케이션 코드, DB schema, 기존 migration, 의존성은 변경하지 않는다.

## 수용 기준

1. 4개 tracked 자산이 Team Harness 정본과 byte-for-byte 일치한다.
2. SQL 검사기는 migration 디렉터리의 `DROP TABLE`, `TRUNCATE`,
   `ALTER … DROP COLUMN`을 거부하고 실제 주석 승인마커만 인정한다.
3. Alembic 검사기는 upgrade 계열의 파괴 op를 거부하되 downgrade는 검사하지 않는다.
4. ActiveRecord 검사기는 `def change/up`의 파괴 op를 거부하되 `def down`은
   검사하지 않는다.
5. 각 검사기는 문자열/주석에 숨긴 키워드를 오탐하지 않고, 문자열로 위장한
   승인마커를 인정하지 않는다.
6. 현재 DriveTree Prisma SQL migration 3개는 통과하고 Alembic/ActiveRecord는
   self-skip한다.
7. repo-sync가 `OK 18 / WEAK 0 / WARN 0 / MISSING 0`과 exit 0을 보고한다.
8. backend/frontend 전체 quality, PR required CI, review, Vercel 게이트가 통과한다.
9. post-merge main/develop protection에 `destructive-ddl`이 required로 추가되고
   그 외 불변식은 유지된다.

## TDD·검증

1. **RED** — 최신 `develop`의 repo-sync에서 destructive-DDL chain 6건이
   MISSING이며 대상 파일 4개가 없음을 확인한다.
2. **GREEN** — 정본 4개를 최소 변경으로 백필하고 canonical equality, 구문,
   현재 migration, 안전/파괴/marker-spoof 표본을 검증한다.
3. **회귀 검증** — repo-sync zero drift와 backend/frontend 전체 quality를 실행한 뒤
   PR required CI를 통과시킨다.
4. **운영 강제** — merge 후 branch protection을 스냅샷하고 단일 context 추가 API로
   `destructive-ddl`만 추가한 뒤 전후 불변식을 원본 API에서 반증한다.
