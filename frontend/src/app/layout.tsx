import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DriveTree | 초보운전자의 든든한 길잡이",
  description: "면허 학원도, 유튜브도 알려주지 않는, 초보운전자가 진짜 막막한 도로 위 모든 순간을 위한 맞춤형 가이드 & AI 챗봇",
  keywords: ["초보운전", "운전면허", "비보호 좌회전", "접촉사고", "차량유지비", "범칙금 계산기"],
  openGraph: {
    title: "DriveTree | 초보운전자의 든든한 길잡이",
    description: "진짜 막막한 도로 위 상황을 해결해주는 AI 챗봇과 실전 가이드",
    type: "website",
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} h-full`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌳</text></svg>" />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--canvas)] text-[var(--ink)] antialiased selection:bg-[var(--primary)] selection:text-white">

        {/* Global Nav — 44px, true black */}
        <header
          role="banner"
          className="sticky top-0 z-50 w-full h-11 flex items-center"
          style={{ background: "var(--surface-black)" }}
        >
          <div className="w-full max-w-[980px] mx-auto px-5 flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              aria-label="DriveTree 홈으로"
              className="flex items-center gap-1.5 text-white text-sm font-semibold tracking-tight hover:opacity-80 transition-opacity"
              style={{ letterSpacing: "-0.12px" }}
            >
              <span aria-hidden="true">🌳</span>
              <span>DriveTree</span>
            </Link>

            {/* Desktop nav links */}
            <nav
              aria-label="주요 메뉴"
              className="hidden md:flex items-center gap-5"
            >
              {[
                { href: "/", label: "가이드" },
                { href: "/calculators", label: "계산기" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[12px] text-white/80 hover:text-white transition-colors"
                  style={{ letterSpacing: "-0.12px" }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right cluster */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin/login"
                className="text-[12px] text-white/50 hover:text-white/80 transition-colors hidden md:block"
                style={{ letterSpacing: "-0.12px" }}
              >
                관리자
              </Link>
              {/* Mobile links */}
              <div className="flex md:hidden items-center gap-2">
                <Link href="/" className="text-[11px] text-white/70 hover:text-white transition-colors">가이드</Link>
                <span className="text-white/20 text-[10px]">|</span>
                <Link href="/calculators" className="text-[11px] text-white/70 hover:text-white transition-colors">계산기</Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-grow flex flex-col">{children}</main>
        <SpeedInsights />
        <Analytics />

        {/* Footer — parchment */}
        <footer
          role="contentinfo"
          className="w-full py-16"
          style={{ background: "var(--canvas-parchment)" }}
        >
          <div className="max-w-[980px] mx-auto px-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b"
              style={{ borderColor: "var(--hairline)" }}
            >
              {/* Brand column */}
              <div>
                <p className="text-[14px] font-semibold text-[var(--ink)] mb-3" style={{ letterSpacing: "-0.224px" }}>
                  DriveTree
                </p>
                <p className="text-[14px] text-[var(--ink-muted-80)] leading-relaxed">
                  면허 시험 준비부터 접촉사고 대처까지, 초보운전자를 위한 실전 가이드
                </p>
              </div>

              {/* Links */}
              <div>
                <p className="text-[14px] font-semibold text-[var(--ink)] mb-3" style={{ letterSpacing: "-0.224px" }}>
                  서비스
                </p>
                <ul className="space-y-1">
                  {[
                    { href: "/", label: "가이드 도서관" },
                    { href: "/calculators", label: "범칙금 · 유지비 계산기" },
                    { href: "/admin/login", label: "관리자 백오피스" },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-[17px] text-[var(--primary)] hover:underline"
                        style={{ lineHeight: "2.41", letterSpacing: "-0.374px" }}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* External */}
              <div>
                <p className="text-[14px] font-semibold text-[var(--ink)] mb-3" style={{ letterSpacing: "-0.224px" }}>
                  외부 링크
                </p>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="https://www.koroad.or.kr/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[17px] text-[var(--primary)] hover:underline"
                      style={{ lineHeight: "2.41", letterSpacing: "-0.374px" }}
                    >
                      도로교통공단
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Legal row */}
            <p
              className="mt-6 text-[12px]"
              style={{ color: "var(--ink-muted-48)", letterSpacing: "-0.12px", lineHeight: "1.0" }}
            >
              © {new Date().getFullYear()} DriveTree. 본 정보는 공식 자료 기반의 추정값이며 실제 처분과 다를 수 있습니다.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
