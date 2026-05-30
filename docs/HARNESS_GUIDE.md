# Claude Code 하네스 엔지니어링 가이드

> DriveTree 프로젝트에서 구축한 하네스를 새 프로젝트에 적용하기 위한 가이드.
> **범용 설정**과 **프로젝트별 커스터마이징** 항목을 분리해 기술한다.

---

## 파일 구조

```
프로젝트 루트/
├── CLAUDE.md                    ← 프로젝트 규칙 (git flow, 커밋 메시지)
├── CLAUDE.local.md              ← 로컬 개발 환경 (gitignore됨)
├── backend/CLAUDE.md            ← 백엔드 기술 스택 패턴
├── frontend/CLAUDE.md           ← 프론트엔드 기술 스택 패턴
├── .gitignore                   ← CLAUDE.local.md 추가 필수
└── .claude/
    ├── settings.json            ← Hook 설정 ($schema 포함)
    ├── settings.local.json      ← 권한 설정 (gitignore됨)
    ├── hooks/
    │   ├── session-start.sh     ← 세션 시작 컨텍스트 주입
    │   ├── validate-edit.sh     ← 파일 저장 시 자동 검증
    │   └── guard-dangerous.sh   ← 위험 명령 사전 차단
    ├── commands/
    │   ├── init.md              ← 세션 컨텍스트 복원
    │   ├── feature-add.md       ← TDD 신규 기능 개발
    │   ├── feature-modify.md    ← TDD 기능 수정
    │   ├── hotfix.md            ← 운영 긴급 수정
    │   ├── release-check.md     ← 배포 전 품질 게이트
    │   └── release.md           ← 릴리즈 실행
    └── rules/
        ├── prisma.md            ← Prisma 작업 시 조건부 로드
        └── ci.md                ← CI 파일 작업 시 조건부 로드

~/.claude/
├── CLAUDE.md                    ← Karpathy 4원칙 (전역)
└── settings.json                ← effortLevel, 전역 권한
```

---

## 1. 전역 설정 (`~/.claude/`)

### Karpathy 4원칙 (`~/.claude/CLAUDE.md`)

모든 프로젝트에 공통 적용. 내용은 그대로 복사.

```markdown
# 행동 지침 — 모든 프로젝트 공통
## 1. 코딩 전에 생각하기
## 2. 단순함 우선
## 3. 외과적 수정
## 4. 목표 기반 실행
```

### 전역 settings (`~/.claude/settings.json`)

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "effortLevel": "high",
  "permissions": { "defaultMode": "auto" }
}
```

---

## 2. 프로젝트 CLAUDE.md 계층

### 루트 `CLAUDE.md` — 프로젝트별 커스터마이징 필요

```markdown
# 프로젝트명 — Claude Code 작업 규칙

@CLAUDE.local.md   ← 로컬 개발 환경 자동 주입

## 코딩 전 원칙     ← Karpathy 4원칙 (전역과 중복이지만 명시)
## 디자인 레퍼런스  ← 프로젝트별 디자인 시스템 파일 경로
## 멀티에이전트 커맨드 목록
## Git Flow        ← 브랜치 전략 (아래 템플릿 그대로 사용 가능)
## 커밋 메시지 규칙 ← 한국어/영어 선택
## CI 주의사항      ← 프레임워크별 빌드/테스트 명령어
```

**⚠️ 커스터마이징 필수 항목:**
- 디자인 레퍼런스 파일 경로
- 커밋 메시지 언어·타입
- CI 빌드/테스트 명령어

### `backend/CLAUDE.md`, `frontend/CLAUDE.md`

기술 스택별로 작성. DriveTree 버전을 참고해 아래 항목을 교체:

| 항목 | DriveTree | 새 프로젝트 |
|---|---|---|
| 버전 고정 표 | NestJS 11, Prisma 7 | 실제 사용 버전 |
| 코드 패턴 | NestJS DI, Prisma.sql | 프레임워크 정석 |
| 금지 패턴 | $queryRawUnsafe 등 | 프레임워크별 위험 패턴 |
| 테스트 패턴 | Jest + @nestjs/testing | 실제 사용 테스트 프레임워크 |

### `CLAUDE.local.md` (gitignore됨)

```markdown
# 로컬 개발 환경
## 서비스 URL
- 백엔드: http://localhost:PORT
- 프론트엔드: http://localhost:PORT

## 빠른 시작
(프로젝트별 명령어)

## 로컬 테스트 계정
(필요 시)
```

---

## 3. Hooks 설정

### `session-start.sh` — 커스터마이징 필요

```bash
#!/bin/bash
# Git 컨텍스트는 범용, 배포 도구 섹션만 프로젝트별 수정

# Railway 사용 시: --project <ID> --environment production 수정
railway link --project <PROJECT_ID> --environment production 2>/dev/null

# Vercel 사용 시: 그대로 사용 가능
VERCEL_USER=$(vercel whoami 2>/dev/null)
```

**⚠️ 커스터마이징:** Railway project ID, 사용하지 않는 배포 도구 섹션 제거

### `validate-edit.sh` — 커스터마이징 필요

```bash
# 백엔드 섹션: 디렉토리 경로 + 검증 명령어 수정
if [[ "$FILE_PATH" == "$PROJECT_ROOT/backend/src/"* ]]; then
  npx prettier --write "$FILE_PATH"   # prettier 미사용 시 제거
  npx eslint "$FILE_PATH"             # lint 도구 교체 가능
  npx jest "$SPEC" --no-coverage      # 테스트 프레임워크 교체 가능

# 프론트엔드 섹션: 타입 체크 명령어 수정
if [[ "$FILE_PATH" == "$PROJECT_ROOT/frontend/src/"* ]]; then
  timeout 60 npx tsc --noEmit         # TypeScript 미사용 시 교체
```

### `guard-dangerous.sh` — 범용 (그대로 사용 가능)

프로젝트 루트 경로는 `git rev-parse`로 동적 감지하므로 수정 불필요.

---

## 4. `.claude/settings.json` — 범용 (그대로 사용 가능)

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "SessionStart":  [{ "matcher": "*", "hooks": [{ "type": "command", "command": "bash .claude/hooks/session-start.sh", "timeout": 10 }] }],
    "PreToolUse":    [{ "matcher": "Bash", "hooks": [{ "type": "command", "command": "bash .claude/hooks/guard-dangerous.sh", "timeout": 10, "statusMessage": "위험 명령 검사 중..." }] }],
    "PostToolUse":   [{ "matcher": "Edit|Write", "hooks": [{ "type": "command", "command": "bash .claude/hooks/validate-edit.sh", "timeout": 120, "statusMessage": "코드 검증 중..." }] }],
    "SubagentStop":  [{ "matcher": "*", "hooks": [{ "type": "command", "command": "osascript -e 'display notification \"에이전트 완료\" with title \"Claude Code\"'", "timeout": 5 }] }],
    "Stop":          [{ "matcher": "*", "hooks": [{ "type": "command", "command": "osascript -e 'display notification \"작업 완료\" with title \"Claude Code\" sound name \"Glass\"'", "timeout": 5 }] }]
  }
}
```

---

## 5. Commands — 커스터마이징 필요

| 커맨드 | 커스터마이징 항목 |
|---|---|
| `feature-add.md` | 검증 명령어 (`npm test`, `npm run build` 등) |
| `feature-modify.md` | 동일 |
| `hotfix.md` | 없음 (범용) |
| `release-check.md` | Agent A·B 검증 명령어 |
| `release.md` | 스테이징·프로덕션 URL, Railway project ID |
| `init.md` | 없음 (범용) |

### 추가로 필요한 커맨드

프로젝트 성격에 따라 추가:

- `/content-add` — CMS 성격의 콘텐츠 관리 기능이 있을 때
- `/design-qa` — 디자인 시스템 준수 검사가 필요할 때

---

## 6. `.claude/rules/` — 프로젝트별 작성

```markdown
---
paths: ["해당하는/파일/패턴/**"]
---

# 규칙 제목
(해당 파일 작업 시 Claude에게 전달할 규칙)
```

**권장 rules 파일:**
- `prisma.md` — DB 마이그레이션 사용 시
- `ci.md` — CI/CD 파이프라인 있을 때
- `docker.md` — Docker 사용 시
- `api.md` — 외부 API 연동이 많을 때

---

## 7. MCP 설정

### GitHub MCP (범용)

```bash
# wrapper 스크립트 생성
mkdir -p ~/.claude/mcp-wrappers
cat > ~/.claude/mcp-wrappers/github.sh << 'EOF'
#!/bin/bash
export GITHUB_PERSONAL_ACCESS_TOKEN=$(gh auth token 2>/dev/null)
exec npx -y @modelcontextprotocol/server-github "$@"
EOF
chmod +x ~/.claude/mcp-wrappers/github.sh

# user scope로 등록 (모든 프로젝트에서 사용 가능)
claude mcp add github --scope user -- ~/.claude/mcp-wrappers/github.sh
```

### 프로젝트별 MCP

Vercel, Linear, Notion 등은 프로젝트 특성에 따라 추가.

---

## 8. .gitignore 필수 추가 항목

```gitignore
.claude/           ← Claude Code 설정 전체 (로컬 전용)
CLAUDE.local.md    ← 로컬 개발 환경 설정
```

---

## 9. 새 프로젝트 적용 체크리스트

### 전역 (최초 1회)
- [ ] `~/.claude/CLAUDE.md` — Karpathy 4원칙 작성
- [ ] `~/.claude/settings.json` — effortLevel: "high" 설정
- [ ] GitHub MCP wrapper 생성 + 등록

### 프로젝트별
- [ ] `CLAUDE.md` — git flow, 커밋 규칙, CI 명령어
- [ ] `backend/CLAUDE.md` — 기술 스택 버전 + 패턴
- [ ] `frontend/CLAUDE.md` — 기술 스택 버전 + 패턴
- [ ] `CLAUDE.local.md` — 로컬 URL, 빠른 시작, 테스트 계정
- [ ] `.gitignore` — `.claude/`, `CLAUDE.local.md` 추가
- [ ] `.claude/hooks/session-start.sh` — Railway/Vercel ID 수정
- [ ] `.claude/hooks/validate-edit.sh` — 검증 명령어 수정
- [ ] `.claude/hooks/guard-dangerous.sh` — 그대로 복사
- [ ] `.claude/settings.json` — 그대로 복사
- [ ] `.claude/commands/` — release.md URL, 검증 명령어 수정
- [ ] `.claude/rules/` — 프로젝트 특성에 맞게 작성
- [ ] Railway 링크: `railway link --project <ID> --environment production`

---

## 10. 규모별 추가 설정

### 팀 프로젝트

- `.claude/settings.json`과 `.claude/commands/`를 **gitignore에서 제외** → 팀 공유
- `.claude/settings.local.json`만 gitignore 유지 (개인 토큰)
- `feature-add.md`, `feature-modify.md`에 PR 생성 단계 추가 (GitHub MCP 활용)
- 테스트 커버리지 최소 기준 추가 (release-check Agent A에 `--coverage --coverageThreshold` 추가)

### 대규모 모노레포

- 패키지별 `CLAUDE.md` 대신 `.claude/rules/` + `paths` frontmatter 활용
- `claudeMdExcludes`로 불필요한 CLAUDE.md 로드 제외
