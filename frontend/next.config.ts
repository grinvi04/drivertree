import type { NextConfig } from 'next'

/**
 * 보안 헤더 — XSS, clickjacking, MIME sniffing 등 일반적 웹 공격 방어 라인
 *
 * CSP 정책 결정:
 * - script-src: production에서도 'unsafe-inline' 허용. Next.js 16은 hydration용
 *   인라인 <script>로 초기 state/route 데이터를 직렬화하는데, 'self'만 허용하면
 *   모든 인라인 스크립트가 차단되어 페이지가 SSR HTML 그대로 멈춤(JS 미실행).
 *   진짜 strict mode를 원하면 Next.js middleware로 nonce 기반 CSP 도입이 정석이며,
 *   현재 단계는 'unsafe-inline'으로 hydration을 살리고 XSS는 DOMPurify·escapeHtml
 *   이중 sanitize + script-src 'self' 외부 출처 차단으로 방어한다.
 *   (follow-up: docs/NEXT_STEPS.md — nonce 기반 CSP migration)
 * - style-src: 'unsafe-inline' 유지(React가 style props로 inline style 주입)
 * - connect-src: API 도메인 환경변수로 동적 확장
 * - 그 외 frame-ancestors none / object-src none / X-Frame-Options DENY 로
 *   clickjacking·플러그인 임베드 차단
 */
const apiOrigin = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : 'http://localhost:4000'

const cspDirectives = [
  "default-src 'self'",
  // dev는 HMR을 위해 unsafe-eval 추가, production은 unsafe-inline 만(eval 차단)
  process.env.NODE_ENV === 'production'
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  // Tailwind v4 + React inline styles
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  `connect-src 'self' ${apiOrigin}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
]

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  // lucide-react 1.x는 배럴 파일에 tree-shaking 미작동 — 개별 아이콘 파일로 리라이트
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
