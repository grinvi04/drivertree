# DriveTree — Claude Code 작업 규칙

## Git Flow

이 프로젝트는 **git flow**를 사용한다. 아래 규칙을 반드시 지킬 것.

### 브랜치 구조

| 브랜치 | 용도 | 직접 커밋 |
|---|---|---|
| `main` | 운영 릴리즈만 | ❌ 금지 |
| `develop` | 통합 브랜치 | ❌ 금지 |
| `feature/*` | 신규 기능 | ✅ |
| `fix/*` | 버그 수정 (비긴급) | ✅ |
| `hotfix/*` | 운영 긴급 수정 | ✅ |
| `release/*` | 릴리즈 준비 | ✅ |

### 작업 흐름

**기능 개발 / 버그 수정 (비긴급)**
```
develop → feature/xxx 또는 fix/xxx → develop (merge --no-ff)
```
1. `git checkout -b feature/xxx develop`
2. 작업 후 커밋
3. `git checkout develop && git merge --no-ff feature/xxx`
4. 브랜치 삭제

**긴급 운영 수정 (hotfix)**
```
main → hotfix/xxx → main (tag) + develop (merge --no-ff)
```
1. `git checkout -b hotfix/xxx main`
2. 수정 후 커밋
3. `git checkout main && git merge --no-ff hotfix/xxx && git tag vX.X.X`
4. `git checkout develop && git merge --no-ff hotfix/xxx`  ← **반드시 develop에도 반영**
5. 브랜치 삭제

**릴리즈**
```
develop → release/vX.X.X → main (tag) + develop (merge --no-ff)
```
1. `git checkout -b release/vX.X.X develop`
2. 버전 번호·CHANGELOG 수정
3. `git checkout main && git merge --no-ff release/vX.X.X && git tag vX.X.X`
4. `git checkout develop && git merge --no-ff release/vX.X.X`
5. 브랜치 삭제

### 핵심 규칙 요약

- `main`과 `develop`에 **직접 커밋 금지** — 반드시 브랜치를 거친다
- hotfix는 `main`과 `develop` **양쪽에 머지** — 어느 하나라도 빠지면 코드 분기
- 머지는 항상 `--no-ff` — 히스토리에 브랜치 흔적을 남긴다
- 브랜치 완료 후 삭제
- 릴리즈마다 `git tag vX.X.X`

---

## 커밋 메시지 규칙

모든 커밋 메시지는 **한국어**로 작성한다.

### 형식
```
타입(범위): 제목  ← 50자 이내, 마침표 없음

본문               ← 선택. 변경 이유 위주, 72자 줄바꿈

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>  ← Claude Code 작업 시 필수
```

### 타입 목록

| 타입 | 의미 |
|---|---|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `hotfix` | 운영 긴급 수정 |
| `refactor` | 기능 변화 없는 코드 개선 |
| `style` | 포맷, 세미콜론 등 코드 변경 없음 |
| `test` | 테스트 추가·수정 |
| `docs` | 문서 변경 |
| `chore` | 빌드, 설정, 패키지 등 |
| `perf` | 성능 개선 |
| `ci` | CI/CD 변경 |

### 범위 예시
`backend`, `frontend`, `auth`, `chat`, `ci`, `docs`, `layout`, `계산기`, `챗봇`

### 예시
```
feat(챗봇): 모바일 다이얼로그 전체 화면 전환

고정 너비(350px)가 320px 기기에서 잘리는 문제 수정.
모바일에서 fixed + inset으로 뷰포트 가득 채우도록 변경.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
```
fix(계산기): col-span-2.5 → 유효한 Tailwind 클래스로 교체
```
```
docs(claude): 커밋 메시지 한국어 규칙 추가
```

---

## 백엔드 코드 수정 시

```bash
cd backend && npm run format   # 커밋 전 필수 — prettier 미실행 시 CI lint 실패
```

## 백엔드/프론트엔드 CI install

`.github/workflows/ci.yml`에서 백엔드·프론트 모두 `npm install` 사용 (not `npm ci`).
npm 10.x + wasm32/emnapi optional 패키지 lock 파일 버그 우회용이므로 변경하지 말 것.

---

## 테스트 규칙

### 핵심 원칙

- **모든 테스트는 100% 통과** 상태를 유지한다 — failing 테스트가 있으면 커밋하지 않는다.
- `npm test` (backend) 기준: 새 파일을 추가할 때마다 스펙 파일도 함께 작성한다.
- 테스트는 `*.spec.ts` 패턴으로 `src/` 안에 위치시킨다.

### 유닛 테스트 (서비스 레이어)

- **외부 의존성은 항상 Mock** — `PrismaService`, `JwtService`, `GeminiService`는 jest.fn() stub으로 교체한다.
- **실제 DB 연결 금지** — `$transaction`, `$executeRawUnsafe`도 mock 처리한다.
- Private 메서드 접근이 필요하면 `(service as unknown as { method: ... }).method()` 패턴을 사용한다.
- Mock 설정은 `beforeEach`에서 매 테스트마다 초기화한다.

### 테스트 범위 기준

| 레이어 | 커버 범위 | 비고 |
|---|---|---|
| 서비스 비즈니스 로직 | 정상 경로 + 모든 예외 경로 | NotFoundException, ConflictException, UnauthorizedException 등 |
| 순수 도메인 함수 | 입출력 계약, 경계값, 단조성 | 계산기 수식, 청킹 로직 등 |
| 보안 핵심 로직 | 모든 인젝션 패턴 + 정상 입력 | 프롬프트 인젝션 감지기 등 |
| Controller / DTO | 필수 검증 룰 | 별도 e2e 테스트로 다룬다 |

### 테스트 작성 순서

1. 정상 경로(happy path) 먼저 — 기대 반환값, 의존성 호출 여부
2. 예외 경로 — 각 `throw`마다 1개 테스트
3. 경계값·edge case — 빈 배열, 0, null, 빈 문자열 등

### 커밋 전 확인

```bash
cd backend && npm test   # 모든 테스트 통과 확인
cd backend && npm run lint:check   # lint 0 errors
```
