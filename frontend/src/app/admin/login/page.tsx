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
                  placeholder="아이디를 입력하세요 (디폴트: admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11.5 pl-10.5 pr-4 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-yellow-accent text-xs font-semibold text-slate-200 focus:outline-none"
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
                  placeholder="비밀번호를 입력하세요 (디폴트: drivetreeadmin123!)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11.5 pl-10.5 pr-4 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-yellow-accent text-xs font-semibold text-slate-200 focus:outline-none"
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
              className="w-full h-11.5 rounded-xl btn-yellow-glow text-xs font-bold mt-4"
            >
              {loading ? '인증 토큰 발급 중...' : '백오피스 입장하기'}
            </button>
          </form>
        </div>

        {/* 개발 시 시딩된 계정 안내 */}
        <div className="mt-6 text-center text-[10px] text-slate-600 font-medium">
          💡 시스템 최초 실행 시 데이터베이스에 <br />
          아이디 <code className="text-slate-400">admin</code>, 비밀번호 <code className="text-slate-400">drivetreeadmin123!</code> 로 관리자 계정이 자동 등록(Seed)됩니다.
        </div>
      </div>
    </div>
  );
}
