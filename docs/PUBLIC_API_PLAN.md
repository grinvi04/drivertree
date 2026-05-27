# DriveTree — 공공 API 연동 계획

## 개요

초보운전자에게 실질적인 가치를 제공하는 4개 공공 API 연동 계획.  
날씨·유가 같은 범용 정보(T맵·카카오가 이미 제공)가 아닌, **DriveTree만이 채울 수 있는 공백**에 집중한다.

---

## Phase 1 — 내 차 관리 (국토교통부 + 교통안전공단)

### 1.1 국토교통부 자동차 리콜 API

| 항목 | 내용 |
|---|---|
| 제공처 | 국토교통부 (data.go.kr) |
| 서비스명 | 자동차리콜현황정보조회서비스 |
| 인증 | `serviceKey` (URL 인코딩된 인증키) |
| 엔드포인트 | `https://apis.data.go.kr/1613000/VhclRcllInfoInqireService/getVhclRcllInfoDetail` |
| 주요 파라미터 | `pageNo`, `numOfRows`, `vhclNm` (차량명), `mnfctrNm` (제조사명) |
| 응답 형식 | XML / JSON |

**DriveTree 엔드포인트**: `GET /api/car/recall?model=아반떼&maker=현대`

### 1.2 교통안전공단 자동차 검사 유효기간 조회 API

| 항목 | 내용 |
|---|---|
| 제공처 | 한국교통안전공단 (data.go.kr) |
| 서비스명 | 자동차검사정보조회서비스 |
| 인증 | `serviceKey` |
| 엔드포인트 | `https://apis.data.go.kr/1613000/VhclInspcInfoInqireService/getVhclInspcInfo` |
| 주요 파라미터 | `vhclNo` (차량번호), `pageNo`, `numOfRows` |
| 응답 형식 | XML / JSON |

**DriveTree 엔드포인트**: `GET /api/car/inspection?plate=123가4567`

### 구현 대상 파일 (Phase 1)

```
backend/src/car/
  car.module.ts
  car.controller.ts
  car.service.ts
  dto/
    recall-query.dto.ts
    inspection-query.dto.ts
    recall-result.dto.ts
    inspection-result.dto.ts
  car.service.spec.ts

frontend/src/app/my-car/
  page.tsx           메인 UI (차량번호/차종 입력 → 결과 표시)
```

### 신규 환경변수

| 변수 | 설명 |
|---|---|
| `MOLIT_API_KEY` | 국토교통부 공공데이터 인증키 (리콜 API) |
| `TS_API_KEY` | 한국교통안전공단 공공데이터 인증키 (검사기한 API) |

---

## Phase 2 — 법령 검색 (법제처)

### 2.1 법제처 국가법령정보 API

| 항목 | 내용 |
|---|---|
| 제공처 | 법제처 (law.go.kr) |
| 인증 | OC (Open Content) key |
| 엔드포인트 | `https://www.law.go.kr/DRF/lawSearch.do?OC={key}&target=law&query={keyword}&type=JSON` |
| 용도 | 가이드 콘텐츠 ↔ 실제 법령 조문 연결 |

**DriveTree 엔드포인트**: `GET /api/law/search?query=비보호좌회전`

### 구현 대상 파일 (Phase 2)

```
backend/src/law/
  law.module.ts
  law.controller.ts
  law.service.ts
  dto/
    law-search-query.dto.ts
    law-search-result.dto.ts
  law.service.spec.ts
```

### 신규 환경변수

| 변수 | 설명 |
|---|---|
| `LAW_API_KEY` | 법제처 OC 키 |

---

## Phase 3 — 사고 다발지점 (TAAS)

### 3.1 TAAS 교통사고 분석 시스템 API

| 항목 | 내용 |
|---|---|
| 제공처 | 도로교통공단 TAAS |
| 인증 | API 키 |
| 엔드포인트 | `https://openapi.taas.koroad.or.kr/...` |
| 용도 | 지역별 사고 다발지점 조회 → 초보운전자 위험 구간 안내 |

**DriveTree 엔드포인트**: `GET /api/safety/hotspots?region=서울`

### 구현 대상 파일 (Phase 3)

```
backend/src/safety/
  safety.module.ts
  safety.controller.ts
  safety.service.ts
  dto/
    hotspot-query.dto.ts
    hotspot-result.dto.ts
  safety.service.spec.ts

frontend/src/app/safety/
  page.tsx
```

### 신규 환경변수

| 변수 | 설명 |
|---|---|
| `TAAS_API_KEY` | 도로교통공단 TAAS API 키 |

---

## 작업 순서

| 단계 | 브랜치 | 작업 |
|---|---|---|
| Phase 1 | `feature/public-api-car` | car 모듈 (리콜 + 검사기한) + `/my-car` 프론트 |
| Phase 2 | `feature/public-api-law` | law 모듈 + 콘텐츠 상세 법령 링크 |
| Phase 3 | `feature/public-api-safety` | safety 모듈 + `/safety` 프론트 |

각 Phase 완료 후 `develop` 머지 → 스테이징 검증 → `release/vX.X.X` → `main`.

---

## API 키 발급 방법

1. **data.go.kr 공통** (리콜 + 검사기한)
   - https://www.data.go.kr 회원가입 → 원하는 서비스 신청 → 승인 후 일반 인증키 발급
   - 일반적으로 즉시 또는 1~2일 내 승인

2. **법제처**
   - https://www.law.go.kr/LSW/openapiInfoR.do → OC 키 신청

3. **TAAS**
   - https://openapi.taas.koroad.or.kr → 회원가입 후 API 키 신청
