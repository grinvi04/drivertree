import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "DriveTree | 초보운전자의 든든한 길잡이",
  description: "면허 학원도, 유튜브도 알려주지 않는, 초보운전자가 진짜 막막한 도로 위 모든 순간을 위한 맞춤형 비주얼 가이드 & RAG AI 챗봇",
  keywords: ["초보운전", "운전면허", "비보호 좌회전", "접촉사고", "차량유지비", "범칙금 계산기"],
  openGraph: {
    title: "DriveTree | 초보운전자의 든든한 길잡이",
    description: "진짜 막막한 도로 위 상황을 해결해주는 RAG AI 챗봇과 실전 가이드",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${outfit.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌳</text></svg>" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0B0F19] text-[#F1F5F9] selection:bg-[#FCD34D] selection:text-[#0B0F19]">
        {/* 프리미엄 헤더 */}
        <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/[0.06] backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] flex items-center justify-center font-bold text-[#0B0F19] text-lg shadow-md group-hover:scale-105 transition-transform duration-300">
                🌳
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-yellow-accent transition-colors duration-300">
                  Drive<span className="text-yellow-accent">Tree</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold leading-none tracking-widest uppercase">
                  Beginner Guide
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
              <Link href="/" className="hover:text-yellow-accent transition-colors">
                가이드 도서관
              </Link>
              <Link href="/calculators" className="hover:text-yellow-accent transition-colors">
                범칙금 · 유지비 계산기
              </Link>
              <Link href="/admin/login" className="text-slate-500 hover:text-slate-300 text-[11px] border border-slate-700/60 px-2.5 py-1 rounded-md transition-colors">
                관리자 백오피스
              </Link>
            </nav>

            <div className="flex md:hidden items-center gap-2">
              <Link href="/" className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 transition-colors">
                가이드
              </Link>
              <Link href="/calculators" className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 transition-colors">
                계산기
              </Link>
              <Link href="/admin/login" className="text-[10px] text-slate-500 hover:text-slate-300 border border-slate-800 px-2 py-1 rounded">
                관리자
              </Link>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-grow flex flex-col">{children}</main>

        {/* 프리미엄 푸터 */}
        <footer className="w-full border-t border-white/[0.05] bg-[#070A11] py-8 mt-auto text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <span>🌳 DriveTree</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">v1.0 (MVP)</span>
              </div>
              <p className="text-slate-500 text-center md:text-left mt-1">
                면허 시험 준비부터 접촉사고 대처까지, 초보자가 도로 위에서 느끼는 막막함을 해소합니다.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1.5">
              <div className="flex gap-4 text-slate-400">
                <a href="https://www.koroad.or.kr/" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-accent transition-colors">
                  도로교통공단
                </a>
                <span className="text-slate-700">|</span>
                <Link href="/admin/login" className="hover:text-yellow-accent transition-colors">
                  백오피스
                </Link>
              </div>
              <p className="text-slate-600 text-center md:text-right">
                © {new Date().getFullYear()} DriveTree. All rights reserved. 본 정보는 공식 자료 기반이나 실제 처분과는 차이가 있을 수 있습니다.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
