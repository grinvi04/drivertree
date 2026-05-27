'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { LawItem } from '@/types';
import {
  BookOpen,
  Search,
  ExternalLink,
  AlertTriangle,
  Info,
  ChevronRight,
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  '비보호좌회전',
  '정지선 위반',
  '속도위반',
  '음주운전',
  '어린이보호구역',
  '안전거리',
];

export default function LawPage() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<LawItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setLoading(true);
    setError(null);
    setMessage(null);
    setSearched(true);
    try {
      const res = await api.searchLaw(trimmed);
      setItems(res.items);
      setTotal(res.total);
      if (res.message) setMessage(res.message);
    } catch {
      setError('법령 검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(raw?: string) {
    if (!raw || raw.length !== 8) return raw;
    return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">도로교통 법령 검색</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8 ml-[52px]">
          법제처 국가법령정보 기반 — 궁금한 교통 법령을 직접 확인하세요.
        </p>

        {/* 검색창 */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSearch(query);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: 비보호좌회전, 어린이보호구역, 음주운전"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm shrink-0"
            >
              <Search className="w-4 h-4" />
              {loading ? '검색 중...' : '검색'}
            </button>
          </form>

          {/* 추천 키워드 */}
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => void handleSearch(q)}
                className="text-xs text-slate-400 bg-white/5 hover:bg-violet-500/20 hover:text-violet-300 border border-white/10 hover:border-violet-500/30 px-3 py-1 rounded-full transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* API 키 미설정 안내 */}
        {message && (
          <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm mb-4">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* 결과 */}
        {searched && !loading && !error && !message && (
          <div>
            <p className="text-slate-400 text-sm mb-3">
              <span className="text-white font-semibold">&quot;{query}&quot;</span> 검색 결과{' '}
              <span className="text-white font-semibold">{total}건</span>
            </p>

            {items.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-slate-400 font-semibold">검색 결과가 없습니다.</p>
                <p className="text-xs text-slate-600 mt-1">다른 키워드로 검색해보세요.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="bg-white/[0.04] border border-white/10 hover:border-violet-500/30 rounded-xl p-4 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-white text-sm">{item.name}</span>
                          {item.type && (
                            <span className="text-[11px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">
                              {item.type}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          {item.ministry && (
                            <span className="flex items-center gap-1">
                              <ChevronRight className="w-3 h-3" />
                              {item.ministry}
                            </span>
                          )}
                          {item.effectiveDate && (
                            <span>시행 {formatDate(item.effectiveDate)}</span>
                          )}
                        </div>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-3 py-1.5 rounded-lg transition-all"
                      >
                        원문 보기
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 출처 안내 */}
        <div className="flex items-start gap-2 text-xs text-slate-600 mt-6">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            법제처 국가법령정보 오픈API 기반. 법령 해석은 공식 자료를 직접 확인하거나 전문가에게
            문의하세요.
          </span>
        </div>
      </div>
    </div>
  );
}
