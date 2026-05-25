'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.login(username, password);
      // 토큰 및 세션 정보 저장
      localStorage.setItem('drivetree_token', res.accessToken);
      localStorage.setItem('drivetree_user', res.username);
      
      // 대시보드로 이동
      router.push('/admin/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다. 자격 증명을 확인해 주세요.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full flex flex-col min-h-screen bg-[#0B0F19] items-center justify-center py-20">
      {/* 옐로우 글로우 데코 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-yellow-accent/5 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full px-4 relative z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-yellow-accent font-semibold transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          가이드 홈으로 가기
        </Link>

        {/* 로그인 카드 */}
        <div className="rounded-3xl glass-panel p-8 border border-white/[0.06] shadow-2xl">
          <div className="text-center mb-8">
            <span className="inline-block text-3xl mb-2">🌳🔒</span>
            <h2 className="text-xl font-black text-white">DriveTree 백오피스</h2>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
              가이드 콘텐츠 및 챗봇 모니터링 관리자
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* 아이디 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-bold">관리자 계정 아이디</label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="관리자 아이디"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-[46px] pl-[42px] pr-4 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-yellow-accent text-xs font-semibold text-slate-200 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-bold">비밀번호</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="관리자 비밀번호"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[46px] pl-[42px] pr-4 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-yellow-accent text-xs font-semibold text-slate-200 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* 에러 노출 */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] rounded-xl btn-yellow-glow text-xs font-bold mt-4"
            >
              {loading ? '인증 토큰 발급 중...' : '백오피스 입장하기'}
            </button>
          </form>
        </div>

        {/* 관리자 안내 — 자격증명 노출 없음 */}
        <div className="mt-6 text-center text-[10px] text-slate-600 font-medium leading-relaxed">
          관리자 계정은 서버 환경변수 <code className="text-slate-400">ADMIN_USERNAME</code> · <code className="text-slate-400">ADMIN_PASSWORD</code> 로 관리되며,
          <br />초기 시드 이후 비밀번호 변경은 운영자에게 문의하세요.
        </div>
      </div>
    </div>
  );
}
