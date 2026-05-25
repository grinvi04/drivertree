import type { NextConfig } from "next";

/**
 * 보안 헤더 — XSS, clickjacking, MIME sniffing 등 일반적 웹 공격 방어 라인
 *
 * CSP 주의:
 * - Next.js 16은 dev 모드에서 inline eval/style을 사용하므로 'unsafe-eval', 'unsafe-inline' 허용 필요
 * - production 빌드에서도 React가 inline style을 일부 주입하므로 style-src 'unsafe-inline' 유지
 * - script-src는 strict 모드 — self만 허용 (admin 마크다운에 inline script가 들어와도 차단됨)
 * - connect-src는 API 도메인 환경변수로 동적 확장
 */
const apiOrigin = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : "http://localhost:4000";

const cspDirectives = [
  "default-src 'self'",
  // Next.js 16은 dev에서 eval을 쓰므로 dev는 unsafe-eval 추가. production은 self만
  process.env.NODE_ENV === "production"
    ? "script-src 'self'"
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
];

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
