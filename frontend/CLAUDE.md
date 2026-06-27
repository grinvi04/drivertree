# Frontend — Next.js 16 / React 19 / Tailwind v4

## 버전 고정 (이 버전 외 API 사용 금지)

- `next` 16.2.6 · `react` 19.2.4 · `tailwindcss` ^4 · `lucide-react` ^1.16

---

## App Router — 핵심 규칙

```typescript
// ✅ 서버 컴포넌트 기본 — 'use client' 없이
export default async function Page() { ... }

// ✅ 클라이언트 컴포넌트 — 상태·이벤트 필요할 때만
'use client';
import { useState } from 'react';

// ❌ pages/ 디렉터리 신규 생성 금지
// ❌ getServerSideProps / getStaticProps (Pages Router API) 금지
// ❌ useRouter from 'next/router' → 반드시 'next/navigation' 사용
```

---

## Tailwind v4 — 설정 파일 없음

```css
/* globals.css — 토큰 정의는 @theme inline 블록만 사용 */
@import 'tailwindcss';
@theme inline {
  --color-primary: var(--primary);
}
```

```tsx
{
  /* ✅ @theme inline으로 정의된 토큰 사용 */
}
;<div className="bg-primary text-canvas" />

{
  /* ❌ tailwind.config.js 생성 금지 — v4는 CSS 기반 설정 */
}
{
  /* ❌ arbitrary 값으로 토큰 우회 금지: bg-[#0066cc] → bg-primary 사용 */
}
```

---

## API · 타입 규칙

```typescript
// ✅ API 호출은 반드시 @/lib/api 경유
import { api } from '@/lib/api'

// ✅ 타입은 @/types/index.ts에서만 import
import type { Content } from '@/types'

// ❌ 컴포넌트 파일 내 interface/type 정의 금지
// ❌ fetch('/api/...') 직접 호출 금지
```

---

## 아이콘 · HTML 렌더링

```typescript
// ✅ lucide-react named import만
import { ChevronRight } from 'lucide-react'
// ❌ import * as Icons — 번들 폭증

// ✅ 외부 HTML → DOMPurify 필수
import DOMPurify from 'isomorphic-dompurify'
const clean = DOMPurify.sanitize(html, {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['script', 'iframe', 'form'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick'],
})
// ❌ dangerouslySetInnerHTML에 raw HTML 직접 주입 금지
```

---

## 이미지

```tsx
// ✅ Next.js Image 컴포넌트 사용
import Image from 'next/image'
// ❌ <img> 직접 사용 금지 — LCP 최적화 미적용
```

---

## 제약 규칙

- `style=` prop 금지 (CSS 변수 직접 참조 제외) — Tailwind 클래스만
- `NEXT_PUBLIC_` 없는 env var는 클라이언트 컴포넌트에서 참조 불가
- e2e 테스트는 `frontend/e2e/`에만 작성 (Playwright)
- 에러 상태: `useState<string | null>(null)` + catch에서 `setError` 패턴 통일
