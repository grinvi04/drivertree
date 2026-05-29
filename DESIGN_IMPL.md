# DriveTree — Design System 구현 노트

> **이 파일의 목적**: DESIGN.md(Apple 원본 스펙)를 DriveTree에 실제로 적용한 내용을 기록합니다.
> 새 세션에서 UI 작업 시 DESIGN.md → DESIGN_IMPL.md 순서로 읽으면 의도와 구현 상태를 모두 파악할 수 있습니다.

---

## 토큰 매핑 (DESIGN.md → CSS 변수)

`frontend/src/app/globals.css` `:root` 블록에 정의됩니다.

| DESIGN.md 토큰 | CSS 변수 | 값 | 비고 |
|---|---|---|---|
| `{colors.primary}` | `--primary` | `#0066cc` | 모든 인터랙티브 요소에 단독 사용 |
| `{colors.primary-focus}` | `--primary-focus` | `#0071e3` | 포커스 링, input onFocus 테두리 |
| `{colors.primary-on-dark}` | `--primary-on-dark` | `#2997ff` | 다크 타일 위 링크/강조 텍스트 |
| `{colors.canvas}` | `--canvas` | `#ffffff` | 기본 흰 배경, 카드 배경 |
| `{colors.canvas-parchment}` | `--canvas-parchment` | `#f5f5f7` | 섹션 교체 배경, 폼 input 배경 |
| `{colors.surface-tile-1}` | `--surface-tile-1` | `#272729` | 다크 CTA 타일 (`tile-dark` 클래스) |
| `{colors.surface-black}` | `--surface-black` | `#000000` | 글로벌 네비게이션 바 배경 |
| `{colors.ink}` | `--ink` | `#1d1d1f` | 헤드라인, 본문 텍스트 |
| `{colors.ink-muted-80}` | `--ink-muted-80` | `#333333` | 서브 본문, 설명 텍스트 |
| `{colors.ink-muted-48}` | `--ink-muted-48` | `#7a7a7a` | 메타 정보, 비활성 텍스트 |
| `{colors.body-muted}` | `--body-muted` | `#cccccc` | 다크 타일 위 보조 텍스트 |
| `{colors.hairline}` | `--hairline` | `#e0e0e0` | 카드 테두리, 구분선 |
| `{colors.divider-soft}` | `--divider-soft` | `rgba(0,0,0,0.08)` | 소프트 구분선 |

### 미구현 토큰 (현재 DriveTree에서 사용하지 않음)
- `{colors.surface-tile-2}`, `{colors.surface-tile-3}`: 다크 타일 미세 변형 — 단일 다크 타일만 사용
- `{colors.surface-pearl}`, `{colors.surface-chip-translucent}`: Pearl Button, 사진 위 원형 버튼 없음
- `{typography.button-large}` (18px/300): 스토어 히어로 CTA — DriveTree에 해당 없음
- `{typography.lead-airy}` (24px/300): 에디토리얼 본문 — DriveTree에 해당 없음

---

## 유틸리티 클래스 (`globals.css`)

새 UI 작업 시 이 클래스들을 우선 사용합니다. Tailwind 클래스로 대체하지 말 것.

### `.btn-primary`
`{component.button-primary}` 구현.
```css
background: var(--primary);
color: #ffffff;
border-radius: 9999px;          /* {rounded.pill} */
padding: 11px 22px;
font-size: 17px; font-weight: 400;
letter-spacing: -0.374px;
active: scale(0.95)             /* 시스템 micro-interaction */
```

### `.btn-ghost`
`{component.button-secondary-pill}` 구현.
```css
background: transparent;
color: var(--primary);
border: 1px solid var(--primary);
border-radius: 9999px;
padding: 11px 22px;
```

### `.utility-card`
`{component.store-utility-card}` 구현.
```css
background: var(--canvas);
border: 1px solid var(--hairline);
border-radius: 18px;            /* {rounded.lg} */
padding: 24px;                  /* {spacing.lg} */
```
> 카드에 그림자 추가 금지 — DESIGN.md "Don't add shadows to cards."

### `.tile-dark`
`{component.product-tile-dark}` 구현.
```css
background: var(--surface-tile-1);  /* #272729 */
color: #ffffff;
```

### `.tile-parchment`
`{component.product-tile-parchment}` 구현.
```css
background: var(--canvas-parchment);
```

---

## 페이지별 섹션 구조

Apple 스펙의 "light hero → dark tile → parchment footer" 리듬을 DriveTree에 적용한 방식:

### 홈 (`/`)
```
Section 1 — 흰 히어로    background: var(--canvas)           ← product-tile-light
Section 2 — 파치먼트      background: var(--canvas-parchment) ← 검색 + 가이드 그리드
Section 3 — 다크 타일     .tile-dark                          ← AI 챗봇 CTA
```

### 가이드 상세 (`/content/[slug]`)
```
전체 — 흰 배경            background: var(--canvas)
```
마크다운 렌더러가 `style=` 인라인 스타일을 생성하며, DOMPurify `ADD_ATTR: ['style']`로 허용.

### 계산기 (`/calculators`)
```
전체 — 파치먼트 배경      background: var(--canvas-parchment)
카드들 — .utility-card
```

### 관리자 로그인 (`/admin/login`)
```
페이지 — 파치먼트         background: var(--canvas-parchment)
폼 카드 — .utility-card
```

---

## 폰트

SF Pro 대체로 **Inter** (Google Fonts) 사용. `layout.tsx`에서 로드.

```typescript
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
```

DESIGN.md 권고사항 적용:
- `letter-spacing: -0.374px` — 17px 이상 모든 텍스트에 적용
- 히어로 헤드라인: `letter-spacing: -0.28px` (Inter는 SF Pro보다 폭이 넓어 약간 더 조임)
- body: `font-size: 17px`, `line-height: 1.47`, `letter-spacing: -0.374px`

---

## 네비게이션

### 글로벌 네비 (`layout.tsx`)
- 배경: `var(--surface-black)` = `#000000` — 스펙 그대로
- 높이: 44px
- 링크: 12px / 400 / `-0.12px` 트래킹 — `{typography.nav-link}` 그대로

### 모바일 반응형
- 모바일에서는 로고 + 햄버거 없이 중앙 로고만 노출 (간소화)
- 서브 네비 미구현 — DriveTree 구조상 제품별 서브 네비 불필요

---

## 마크다운 렌더러 (`content/[slug]/page.tsx`)

`renderMarkdown()` 함수가 직접 HTML + 인라인 스타일을 생성합니다.

| 요소 | 스타일 |
|---|---|
| `<p>` | 17px / 400 / 1.75 line-height / -0.3px / `#1d1d1f` |
| `<h2>` (`#`) | 28px / 700 / `#1d1d1f` |
| `<h3>` (`##`) | 22px / 700 / `#1d1d1f` + bottom border |
| `<h4>` (`###`) | 17px / 700 / `#1d1d1f` |
| `<ul>`, `<ol>` | 24px left margin, disc/decimal |
| `<blockquote>` | 4px blue left border, `#f5f8ff` 배경 |
| `<code>` (인라인) | `#f0f0f2` 배경, monospace |
| `<strong>` | 700 weight |

> **DOMPurify 주의**: `ADD_ATTR: ['style']` 없으면 인라인 스타일이 전부 제거됩니다.
> `FORBID_TAGS`에 `script`, `iframe` 등 위험 태그는 유지.

---

## 적용하지 않은 스펙 (의도적 생략)

| 스펙 | 이유 |
|---|---|
| 제품 사진 + 시스템 그림자 | DriveTree는 텍스트 가이드 서비스 — 제품 이미지 없음 |
| `sub-nav-frosted` (frosted glass) | 단일 카테고리 구조 — 페이지별 서브 네비 불필요 |
| `floating-sticky-bar` | 구매 플로우 없음 |
| `configurator-option-chip` | 제품 구성 없음 |
| 다크 모드 카드 변형 | 현재 라이트 모드 전용 |
| backdrop-filter blur | 성능 고려, 필요 없는 위치에는 미적용 |

---

## 체크리스트 — 새 UI 컴포넌트 추가 시

1. **색상**: `var(--primary)` 단독 사용. 두 번째 브랜드 색 금지.
2. **버튼**: CTA는 `.btn-primary` (pill). 보조는 `.btn-ghost` (ghost pill). 다른 형태 신규 추가 자제.
3. **카드**: `.utility-card` 사용. 그림자 추가 금지.
4. **그라디언트**: 배경 그라디언트 금지. 텍스트 그라디언트 금지.
5. **타이포**: 헤드라인 `font-weight: 600`, 본문 `font-weight: 400`. 500 사용 금지.
6. **섹션 분리**: 경계선/테두리 대신 `var(--canvas)` ↔ `var(--canvas-parchment)` ↔ `.tile-dark` 배경 교체로 구분.
7. **다크 타일 링크**: `var(--primary-on-dark)` (#2997ff) 사용. 라이트 표면에서는 `var(--primary)`.
