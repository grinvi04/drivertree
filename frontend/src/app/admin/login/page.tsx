'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
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
      localStorage.setItem('drivetree_user', res.username);
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center py-20 px-5"
      style={{ background: "var(--canvas-parchment)" }}
    >
      <div className="w-full max-w-[400px]">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[14px] mb-8 hover:underline"
          style={{ color: "var(--primary)", letterSpacing: "-0.224px" }}
        >
          ← DriveTree 홈으로
        </Link>

        {/* Card */}
        <div className="utility-card shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-3xl" aria-hidden="true">🌳</span>
            <h1
              className="font-semibold mt-2 mb-1"
              style={{ fontSize: "21px", color: "var(--ink)", letterSpacing: "0" }}
            >
              DriveTree 백오피스
            </h1>
            <p
              className="text-[14px]"
              style={{ color: "var(--ink-muted-48)", letterSpacing: "-0.224px" }}
            >
              관리자 계정으로 로그인하세요
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-username"
                className="text-[14px] font-semibold"
                style={{ color: "var(--ink)", letterSpacing: "-0.224px" }}
              >
                관리자 계정 아이디
              </label>
              <input
                id="admin-username"
                type="text"
                placeholder="관리자 아이디"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 px-4 text-[17px] focus:outline-none transition-colors"
                style={{
                  background: "var(--canvas)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "8px",
                  color: "var(--ink)",
                  letterSpacing: "-0.374px",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary-focus)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline)"; }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-password"
                className="text-[14px] font-semibold"
                style={{ color: "var(--ink)", letterSpacing: "-0.224px" }}
              >
                비밀번호
              </label>
              <input
                id="admin-password"
                type="password"
                placeholder="관리자 비밀번호"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 px-4 text-[17px] focus:outline-none transition-colors"
                style={{
                  background: "var(--canvas)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "8px",
                  color: "var(--ink)",
                  letterSpacing: "-0.374px",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary-focus)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline)"; }}
              />
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-[14px] px-4 py-3 rounded-lg"
                style={{
                  background: "#fff2f2",
                  color: "#c00",
                  border: "1px solid #fcc",
                  letterSpacing: "-0.224px",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-60"
              style={{ height: "44px" }}
            >
              {loading ? '로그인 중...' : '백오피스 입장하기'}
            </button>
          </form>

          <p
            className="mt-6 text-center text-[12px]"
            style={{ color: "var(--ink-muted-48)", letterSpacing: "-0.12px" }}
          >
            관리자 계정은 <code className="text-[11px]">ADMIN_USERNAME</code> ·{' '}
            <code className="text-[11px]">ADMIN_PASSWORD</code> 환경변수로 관리됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
