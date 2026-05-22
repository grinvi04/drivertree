# 🎬 인터뷰 데모 환경 셋업 체크리스트

> 인터뷰 **시작 30분 전** 한 번 따라 하면, 챗봇이 헛소리 없이 진짜 RAG로 동작하는 환경이 완성된다.
> 이 문서는 `docs/USER_RESEARCH.md` 검증 인터뷰의 부속 운영 가이드.

---

## 0. 왜 이 셋업이 중요한가

`docs/USER_RESEARCH.md` 의 4개 가설 중 **H4(차별점)** 는 *"챗봇 데모"* 가 핵심이다.

- 로컬 TF-IDF 폴백 상태로 데모하면 → 답변이 빈약해서 "유튜브가 낫다"는 답을 유도하게 됨 → **검증 자체가 무효**.
- 진짜 Gemini RAG가 동작해야 인터뷰 대상자가 *"이건 ChatGPT랑 뭐가 다른가"* 를 공정하게 판단할 수 있음.

따라서 인터뷰 직전 **Gemini API Key 세팅 + 시드 6건 적재 + 데모 시나리오 답변 사전 검증**을 반드시 거친다.

---

## 1. Gemini API Key 발급 (10분)

### 1.1 발급 절차
1. https://aistudio.google.com 접속 → 구글 계정 로그인
2. 좌측 메뉴 **Get API key** → **Create API key** → 신규 프로젝트 생성 또는 기존 프로젝트 선택
3. 생성된 키 복사

### 1.2 무료 한도 (2026-05 기준)
- `gemini-1.5-flash`: 분당 15 RPM, 일 1,500 RPD 무료
- `text-embedding-004`: 분당 1,500 RPM, 일 일일 한도 충분 (정확한 수치는 https://ai.google.dev/pricing 확인)
- 인터뷰 5명 × 데모 1~2건 = 1일 30 호출 미만 → **무료 한도로 충분**

### 1.3 환경변수 적용
```bash
cd backend
# .env 파일에 발급받은 키 붙여넣기
# GEMINI_API_KEY="AIza..."
```

> [!WARNING]
> `.env` 파일은 `.gitignore` 에 포함되어 있어야 한다. 실수로 커밋되지 않도록 인터뷰 전 한 번 더 확인:
> ```bash
> git status   # backend/.env 가 untracked 면 OK
> ```

---

## 2. 시드 콘텐츠 6건 적재 확인 (5분)

### 2.1 서버 기동
```bash
# Postgres + pgvector 컨테이너
docker compose up -d

# 백엔드 (자동으로 onModuleInit에서 시드 적재)
cd backend
npm run start:dev
```

### 2.2 시드 적재 로그 확인
서버 콘솔에 다음 중 하나가 떠야 한다:

- 첫 실행: `🌱 [DriveTree Seed] Inserted 6 new seed content(s).`
- 재실행: `✅ [DriveTree Seed] All seed contents already present.`

### 2.3 콘텐츠 6건 목록 직접 확인
```bash
curl http://localhost:4000/api/content | jq '.[] | {slug, category, title}'
```

기대 출력 (순서 무관):

| slug | category |
|---|---|
| `license-school-vs-self` | license |
| `license-type-1-vs-2` | license |
| `rules-unprotected-left-turn` | rules |
| `basics-alleyway-priority` | basics |
| `accidents-crash-guide` | accidents |
| `maintenance-engine-oil-cycle` | maintenance |

6건이 다 안 나오면 → 백엔드 로그 확인. 슬러그 중복 에러면 기존 DB에 같은 슬러그가 이미 있다는 의미.

### 2.4 임베딩 적재 확인 (Gemini 사용 시)
```bash
# DB에 직접 접근 — vector(768) 컬럼이 NULL이 아닌 row 수 카운트
docker compose exec postgres psql -U drivetree_user -d drivetree \
  -c "SELECT COUNT(*) AS embedded_chunks FROM \"ContentEmbedding\" WHERE embedding IS NOT NULL;"
```

기대값: **20개 이상** (콘텐츠 6건 × 평균 3~5 chunk).
0이면 → Gemini API Key가 잘못 세팅되었거나 호출이 실패했다는 의미. 백엔드 로그에서 `Gemini embedding generation failed` 메시지 검색.

---

## 3. 챗봇 데모 시나리오 사전 검증 (10분)

각 페르소나용 데모 질문에 대해 **출처가 매칭되어 답변이 나오는지** 미리 한 번 돌려본다. 인터뷰 자리에서 *"어, 왜 출처 안 나오지?"* 를 피하기 위함.

### 3.1 P1 — 면허 학습 단계
```bash
curl -X POST http://localhost:4000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "1종 보통이랑 2종 보통 차이가 뭐예요?"}' | jq
```

- ✅ 기대: 답변에 운전 가능 차종 비교 + 출처에 `license-type-1-vs-2` 슬러그 포함
- ❌ 출처 없음 또는 슬러그 안 맞으면 → 시드 적재 또는 임베딩 실패 가능성

### 3.2 P2 — 실주행 상황
```bash
curl -X POST http://localhost:4000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "좁은 골목에서 차랑 마주쳤어요, 누가 양보해요?"}' | jq
```

- ✅ 기대: 오르막/내리막 양보 원칙 답변 + 출처에 `basics-alleyway-priority`

### 3.3 P3 — 차량 관리
```bash
curl -X POST http://localhost:4000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "엔진오일 언제 갈아야 해요?"}' | jq
```

- ✅ 기대: 7,500~10,000 km 또는 6~12개월 답변 + 출처에 `maintenance-engine-oil-cycle`

### 3.4 출처가 안 매칭되는 경우 트러블슈팅 순서
1. 임베딩이 적재됐는지 (2.4 쿼리 재실행)
2. pgvector 거리 임계치(`0.6`) 가 너무 보수적인지 → `backend/src/chat/chat.service.ts` 에서 임계치 임시 완화 시도
3. 시드 본문이 질문 키워드와 동떨어져 있는지 → 본문에 키워드 보강

---

## 4. 프론트엔드 확인 (5분)

```bash
cd frontend
npm run dev
```

브라우저에서 http://localhost:3000 접속 후 한 번씩 클릭:

- [ ] 메인 페이지 6개 카드 모두 표시
- [ ] 카테고리 필터 (license / rules / basics / accidents / maintenance) 동작
- [ ] 콘텐츠 상세 페이지 (`/content/license-type-1-vs-2`) 마크다운 렌더링 정상
- [ ] 챗봇 다이얼로그 열고 P1 데모 질문 입력 → 답변 + 출처 카드 표시
- [ ] 범칙금 계산기 (`/calculators`) 동작
- [ ] 유지비 계산기 동작

---

## 5. 인터뷰 직전 30초 점검표

인터뷰 자리 앉기 직전, 노트북에서 5초씩 체크.

- [ ] `docker compose ps` — postgres 컨테이너 healthy
- [ ] 백엔드 로그에 `[Nest] ... started successfully` 라인 있음
- [ ] http://localhost:3000 접속 시 메인 페이지 즉시 로딩
- [ ] 챗봇에 *"안녕하세요"* 한 번 보내서 응답 정상
- [ ] 노트북 충전기 가져옴 (데모 30분 + 인터뷰 30분이면 배터리 위험)
- [ ] 음성 녹음 앱 사전 권한 허용 (Mac: 시스템 환경설정 → 보안)
- [ ] `docs/USER_RESEARCH.md` 2장(질문지) 인쇄 또는 다른 화면에 띄움

---

## 6. 인터뷰 종료 후 (당일 안에)

기록을 까먹기 전에 30분 안에 다음을 처리:

1. 음성 녹음 파일 → `docs/interviews/recordings/` 로 이동(폴더 신설)
2. `docs/interviews/YYYYMMDD_<페르소나>_<이니셜>.md` 생성, USER_RESEARCH.md 5장 *"인터뷰 종료 후 즉시 기록할 항목"* 형식으로 정리
3. 가설별 판정(Pass/Fail/중립) 표시
4. 5명 다 끝나면 → `USER_RESEARCH.md` 7장(검증 결과) 채우고, 6장 매트릭스대로 다음 방향 결정
