.PHONY: help dev dev-be dev-fe test lint format build db-up db-down db-seed quality

help:
	@echo "DriveTree 개발 명령어"
	@echo ""
	@echo "  make dev        백엔드 + 프론트엔드 동시 실행 (tmux 필요)"
	@echo "  make dev-be     백엔드만 실행 (port 4000)"
	@echo "  make dev-fe     프론트엔드만 실행 (port 3000)"
	@echo "  make test       백엔드 유닛 테스트 전체 실행"
	@echo "  make lint       백엔드 ESLint 체크"
	@echo "  make format     백엔드 Prettier 포맷"
	@echo "  make build      프론트엔드 프로덕션 빌드"
	@echo "  make db-up      PostgreSQL + pgvector 컨테이너 기동"
	@echo "  make db-down    컨테이너 중지"
	@echo "  make db-seed    DB 마이그레이션 + Prisma 클라이언트 재생성"
	@echo "  make quality    커밋 전 품질 체크 (format + lint + test + build)"

dev-be:
	cd backend && npm run start:dev

dev-fe:
	cd frontend && npm run dev

test:
	cd backend && npm test

lint:
	cd backend && npm run lint:check

format:
	cd backend && npm run format

build:
	cd frontend && npm run build

db-up:
	docker compose up -d

db-down:
	docker compose down

db-seed:
	cd backend && npx prisma migrate deploy && npx prisma generate

quality:
	@echo "=== 1/4 백엔드 포맷 ==="
	cd backend && npm run format
	@echo "=== 2/4 백엔드 lint ==="
	cd backend && npm run lint:check
	@echo "=== 3/4 백엔드 테스트 ==="
	cd backend && npm test
	@echo "=== 4/4 프론트엔드 빌드 ==="
	cd frontend && npm run build
	@echo ""
	@echo "모든 품질 체크 통과"
