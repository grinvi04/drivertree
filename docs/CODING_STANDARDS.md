# DriveTree — 코딩 표준 가이드

> 근거: Google TypeScript Style Guide, NestJS 공식 Best Practices, React 공식 문서, Airbnb JavaScript Style Guide, WCAG 2.1 AA 접근성 기준을 종합해 본 프로젝트에 맞게 정제.

---

## 1. 공통 (TypeScript 전반)

### 1.1 타입 안전성

```typescript
// ❌ Bad — any 사용, 강제 캐스팅
const data = (await fetchSomething()) as SomeType;
const value = x as unknown as Y;

// ✅ Good — 제네릭 명시, 타입 가드
const data = await fetchSomething<SomeType>();
function isGuideContent(v: unknown): v is GuideContent {
  return typeof v === 'object' && v !== null && 'slug' in v;
}
```

- `any` 사용 금지. 불가피한 경우 `unknown` 사용 후 타입 가드.
- `as` 강제 캐스팅은 외부 API 응답 경계에서만 허용, 반드시 주석 추가.
- 함수 반환 타입은 명시적으로 선언 (단순 primitive 제외).

### 1.2 인터페이스 vs 타입

```typescript
// ✅ 객체 형태(shape) → interface
interface GuideContent {
  id: string;
  title: string;
}

// ✅ 유니온, 교차, 유틸리티 → type alias
type CategoryId = 'all' | 'license' | 'basics';
type ReadonlyGuide = Readonly<GuideContent>;
```

### 1.3 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| 클래스/인터페이스 | PascalCase | `GuideContent`, `ChatService` |
| 함수/변수 | camelCase | `fetchContents`, `activeCategory` |
| 상수 | SCREAMING_SNAKE_CASE | `RAG_CONFIG`, `MAX_CHUNK_SIZE` |
| 파일명 (백엔드) | kebab-case | `chat.service.ts`, `rag.config.ts` |
| 파일명 (프론트) | PascalCase (컴포넌트), kebab-case (유틸) | `ChatbotWidget.tsx`, `use-async-data.ts` |
| 불리언 변수 | is/has/can 접두사 | `isLoading`, `hasError`, `canSubmit` |
| 약어 지양 | 전체 단어 사용 | `geminiClient` (not `genAI`), `rankedContents` (not `ranked`) |

### 1.4 매직 넘버/스트링

```typescript
// ❌ Bad
if (distance < 0.6) { ... }
const chunks = results.slice(0, 3);

// ✅ Good
const RAG_CONFIG = {
  SIMILARITY_THRESHOLD: 0.6,
  CHUNK_SEARCH_LIMIT: 3,
} as const;

if (distance < RAG_CONFIG.SIMILARITY_THRESHOLD) { ... }
const chunks = results.slice(0, RAG_CONFIG.CHUNK_SEARCH_LIMIT);
```

---

## 2. 백엔드 (NestJS)

### 2.1 단일 책임 원칙 (SRP)

- **Controller**: HTTP 요청/응답 변환만. 비즈니스 로직 없음.
- **Service**: 비즈니스 로직 담당. 외부 I/O는 Provider를 통해.
- **메서드 최대 길이**: 40줄. 초과 시 private 메서드로 분해.

```typescript
// ❌ Bad — 한 메서드에 검색 + LLM 호출 + DB 저장 혼재
async ask(dto: AskChatDto) {
  // 벡터 검색 로직 20줄
  // Gemini 호출 로직 25줄
  // DB 저장 로직 15줄
}

// ✅ Good — 단계별 private 메서드로 분해
async ask(dto: AskChatDto) {
  const vector = await this.getQueryEmbedding(dto.message);
  const chunks = await this.searchRelevantChunks(vector);
  const response = await this.generateResponse(chunks, dto.message);
  await this.persistChatLog(dto.sessionKey, dto.message, response);
  return response;
}

private async getQueryEmbedding(message: string): Promise<number[] | null> { ... }
private async searchRelevantChunks(vector: number[] | null): Promise<SemanticChunk[]> { ... }
private async generateResponse(chunks: SemanticChunk[], message: string): Promise<BotResponse> { ... }
private async persistChatLog(...): Promise<void> { ... }
```

### 2.2 의존성 주입 (DI)

- 외부 SDK 클라이언트(Gemini, S3 등)는 직접 `new` 하지 않고 `@Injectable()` Provider로 분리.
- Provider는 Interface를 구현해 테스트 시 Mock으로 교체 가능하게.

```typescript
// ✅ Provider 패턴
// common/providers/gemini.provider.ts
export interface ILlmProvider {
  getEmbedding(text: string): Promise<number[]>;
  generateText(prompt: string): Promise<string>;
}

@Injectable()
export class GeminiProvider implements ILlmProvider { ... }

// chat.service.ts
@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmProvider: GeminiProvider,
  ) {}
}
```

### 2.3 에러 처리

- 비즈니스 에러는 `HttpException` 하위 클래스로 명시적 정의.
- `null` 반환으로 조용히 실패하지 않음. 실패 유형을 명확히 구분.
- 모든 `catch` 블록에서 `logger.error` + 적절한 예외 rethrow.

```typescript
// common/exceptions/application.exception.ts
export class EmbeddingUnavailableException extends HttpException {
  constructor() {
    super('임베딩 서비스를 일시적으로 사용할 수 없습니다.', HttpStatus.SERVICE_UNAVAILABLE);
  }
}

// 사용
private async getQueryEmbedding(message: string): Promise<number[]> {
  try {
    return await this.llmProvider.getEmbedding(message);
  } catch (error) {
    this.logger.warn('Embedding failed, falling back to local NLP', error);
    throw new EmbeddingUnavailableException();
  }
}
```

### 2.4 상수 관리

모든 설정값은 `src/common/config/` 또는 `src/common/constants/`에 모아서 관리.

```typescript
// src/common/constants/rag.config.ts
export const RAG_CONFIG = {
  SIMILARITY_THRESHOLD: 0.6,
  CHUNK_SEARCH_LIMIT: 3,
  MAX_CHUNK_SIZE: 500,
  EMBEDDING_MODEL: 'text-embedding-004',
  GENERATION_MODEL: 'gemini-1.5-flash',
} as const;
```

### 2.5 타입 관리

- 공유 타입은 `src/common/types/` 에 정의 후 export.
- 서비스 내부에만 쓰이는 인터페이스는 해당 파일에, 여러 모듈에서 쓰이면 공통 위치로.

---

## 3. 프론트엔드 (Next.js / React)

### 3.1 컴포넌트 설계

- **Page 파일** (`app/**/page.tsx`): 라우팅 진입점만. 최대 50줄. 로직은 컴포넌트로 위임.
- **컴포넌트 파일** (`components/*.tsx`): 최대 200줄. 초과 시 하위 컴포넌트로 분해.
- 단일 파일에 여러 컴포넌트 정의 금지 (default export 하나).

```
src/
├── app/
│   ├── page.tsx           ← 라우팅만 (50줄 이내)
│   └── calculators/
│       └── page.tsx       ← 라우팅만 (50줄 이내)
├── components/
│   ├── GuideLibrary.tsx   ← 가이드 목록 컴포넌트
│   ├── ChatbotWidget.tsx  ← 챗봇 위젯 컴포넌트
│   └── ui/                ← 공용 UI 원자 컴포넌트
├── hooks/
│   ├── useAsyncData.ts    ← 비동기 데이터 패턴
│   └── useErrorHandler.ts ← 에러 처리 훅
├── types/
│   └── index.ts           ← 모든 공유 타입
├── constants/
│   └── categories.ts      ← CATEGORIES 등 공유 상수
└── lib/
    ├── api.ts             ← API 클라이언트 (타입 제네릭)
    └── errors.ts          ← ApiError 클래스
```

### 3.2 커스텀 훅

- 비동기 데이터 로딩은 `useAsyncData` 훅으로 통일.
- API 에러 처리는 `useErrorHandler` 훅으로 통일.
- 컴포넌트 내 `useEffect`가 3개 이상이면 커스텀 훅으로 분리.

```typescript
// hooks/useAsyncData.ts
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  defaultValue: T,
  deps: React.DependencyList = [],
) {
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetcher()
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err : new ApiError(0, String(err))); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, error };
}
```

### 3.3 타입 안전성

- API 호출 함수는 반환 타입을 제네릭으로 명시.
- 강제 타입 캐스팅(`as SomeType`) 금지 — 제네릭 사용.
- 공유 타입은 `types/index.ts` 단일 파일에서 관리.

```typescript
// ❌ Bad
const data = (await api.getContents()) as GuideContent[];

// ✅ Good
// lib/api.ts에서 반환 타입 명시
getContents: (category?: string, search?: string): Promise<GuideContent[]> =>
  apiRequest<GuideContent[]>('/content', { params: { category, search } }),

// 호출부: 타입 자동 추론
const { data: contents } = useAsyncData(
  () => api.getContents(activeCategory, searchQuery),
  [],
);
```

### 3.4 에러 처리

```typescript
// lib/errors.ts
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
  isRateLimit() { return this.statusCode === 429; }
  isServerError() { return this.statusCode >= 500; }
}
```

- 모든 API 에러는 `ApiError` 인스턴스로 표준화.
- 429 Rate Limit, 5xx 서버 에러는 사용자에게 명시적 메시지 노출.
- 에러 무시(`catch {}`) 금지. 최소 `logger.warn`.

### 3.5 상태 관리

- 컴포넌트 간 공유 상태는 Context API + 커스텀 훅으로.
- Props drilling 3단계 이상 시 Context 도입 필수.
- 전역 상태는 최소화; 가능하면 서버 상태(API 캐싱)로 대체.

### 3.6 접근성 (WCAG 2.1 AA)

- 모든 `<button>` 에 `aria-label` 또는 텍스트 내용 필수.
- 모든 `<input>` / `<select>` 에 연결된 `<label>` 또는 `aria-label` 필수.
- Heading 순서 준수 (`h1` → `h2` → `h3`, 단계 건너뜀 금지).
- 최소 글꼴 크기: 모바일 12px (0.75rem). `text-[10px]` 사용 시 `aria-hidden` 고려.
- 색상 대비: 텍스트 4.5:1 이상 (WCAG AA). `text-slate-500`(`#64748B`)은 다크 배경 기준 통과.

```typescript
// ❌ Bad
<button className="...">
  <MessageSquare className="w-6 h-6" />
</button>

// ✅ Good
<button className="..." aria-label="AI 챗봇 열기">
  <MessageSquare className="w-6 h-6" aria-hidden="true" />
</button>
```

### 3.7 성능

- `useCallback` / `useMemo` 는 실제 성능 문제가 있을 때만 사용 (조기 최적화 금지).
- `useEffect` 의존성 배열에서 ESLint 규칙 disable 금지.
- Image 컴포넌트는 Next.js `<Image>` 사용 (자동 최적화).
- 동적 import(`next/dynamic`)로 클라이언트 전용 컴포넌트 번들 분리.

### 3.8 마크다운 렌더링

- 외부 HTML 렌더링 시 반드시 `isomorphic-dompurify`로 sanitize 후 `dangerouslySetInnerHTML` 사용.
- `react-markdown`은 미설치. 커스텀 스타일이 필요한 경우 DOMPurify 패턴 유지.

```typescript
import DOMPurify from 'isomorphic-dompurify';
const clean = DOMPurify.sanitize(html, {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['script', 'iframe', 'form'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick'],
});
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

---

## 4. Git / 커밋 규칙

CLAUDE.md 참고. 요약:
- 브랜치: git flow (`feature/*`, `fix/*`, `hotfix/*`, `release/*`)
- 커밋 메시지: 한국어, `타입(범위): 제목` 형식
- 백엔드 코드 변경 후 `cd backend && npm run format` 필수

---

## 5. 테스트

CLAUDE.md의 테스트 규칙 섹션이 최신 기준. 요약:
- 서비스 메서드 유닛 테스트 필수 (`PrismaService`, `JwtService` 등 외부 의존성 jest.fn() mock).
- **실제 DB 연결 금지** (유닛 테스트). `$transaction` 포함 전부 mock.
- 새 파일 추가 시 `*.spec.ts` 동반 필수 — CI 품질 게이트.
- 모든 테스트 100% 통과 상태 유지. failing 테스트가 있으면 커밋하지 않는다.
