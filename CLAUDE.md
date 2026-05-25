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

## 프론트엔드 CI

`.github/workflows/ci.yml`에서 프론트 install은 `npm install` 사용 (not `npm ci`).
npm 10.x + wasm32 optional 패키지 lock 파일 버그 우회용이므로 변경하지 말 것.
