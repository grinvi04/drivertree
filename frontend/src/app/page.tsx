'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { HelpCircle, Search, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { CATEGORIES } from '@/constants/categories';
import { useAsyncData } from '@/hooks/useAsyncData';
import ChatbotWidget from '@/components/ChatbotWidget';
import type { GuideContent } from '@/types';

const POPULAR_SEARCHES = ['비보호 좌회전', '골목길 양보', '접촉사고 대처'] as const;

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const fetchContents = useCallback(
    () => api.getContents(
      activeCategory === 'all' ? undefined : activeCategory,
      submittedQuery || undefined,
      currentPage,
      12,
    ),
    [activeCategory, submittedQuery, currentPage],
  );

  const { data: result, isLoading } = useAsyncData(
    fetchContents,
    { data: [] as GuideContent[], meta: { total: 0, page: 1, limit: 12, totalPages: 1 } },
    [activeCategory, submittedQuery, currentPage],
  );

  const contents = result.data;
  const meta = result.meta;

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setSubmittedQuery('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchQuery);
    setCurrentPage(1);
  };

  const handlePopularSearch = (term: string) => {
    setSearchQuery(term);
    setSubmittedQuery(term);
  };

  return (
    <div className="relative w-full flex flex-col min-h-screen bg-[#0B0F19] overflow-x-hidden">
      {/* 배경 장식 */}
      <div
        className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-yellow-accent/5 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-[800px] right-1/4 w-[400px] h-[400px] rounded-full bg-yellow-accent/3 blur-[100px] pointer-events-none"
        aria-hidden="true"
      />

      {/* 히어로 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 text-center relative z-10">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-accent/10 border border-yellow-accent/20 text-yellow-accent text-xs font-bold tracking-wide uppercase mb-6 animate-pulse"
          aria-hidden="true"
        >
          🔰 면허 학원도 알려주지 않는 실전 팁
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
          초보운전자가 <br className="sm:hidden" />
          진짜 <span className="text-yellow-gradient">막막한 순간</span>의 등대
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 font-medium mb-10 leading-relaxed">
          유튜브 브이로그나 두꺼운 공식 교본 말고, 도로 위에서 당황스럽게 헷갈릴 때{' '}
          <br className="hidden sm:inline" />
          즉시 꺼내볼 수 있는 맞춤 실생활 가이드와 다정한 RAG 챗봇을 만나보세요.
        </p>

        {/* 검색바 */}
        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto relative mb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-500" aria-hidden="true" />
            <label htmlFor="guide-search" className="sr-only">
              가이드 검색
            </label>
            <input
              id="guide-search"
              type="text"
              placeholder="비보호 좌회전, 주차 요령, 접촉사고 대처 방법..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-28 rounded-2xl bg-white/[0.03] border border-white/[0.08] focus:border-yellow-accent focus:bg-white/[0.05] focus:outline-none text-slate-200 text-sm font-semibold transition-all shadow-lg"
            />
            <button
              type="submit"
              aria-label="가이드 검색하기"
              className="absolute right-2 px-5 py-2.5 rounded-xl btn-yellow-glow text-xs font-bold"
            >
              검색하기
            </button>
          </div>
        </form>

        <div className="text-xs text-slate-500 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>인기 검색어:</span>
          {POPULAR_SEARCHES.map((term, idx) => (
            <span key={term} className="contents">
              {idx > 0 && <span className="text-slate-800" aria-hidden="true">•</span>}
              <button
                onClick={() => handlePopularSearch(term)}
                aria-label={`${term} 검색하기`}
                className="hover:text-yellow-accent underline"
              >
                {term}
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* 카테고리 탭 */}
      <section
        aria-label="가이드 카테고리"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10"
      >
        <div className="flex overflow-x-auto pb-4 gap-3 scrollbar-none snap-x justify-start lg:justify-center">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                aria-pressed={isActive}
                aria-label={`${cat.name} 카테고리 선택`}
                className={`snap-start flex items-center gap-2.5 px-[18px] py-3.5 rounded-2xl shrink-0 border text-left cursor-pointer transition-all duration-300 ${
                  isActive
                    ? 'bg-yellow-accent/15 border-yellow-accent text-white shadow-[0_0_15px_rgba(252,211,77,0.1)]'
                    : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:border-slate-800 hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-colors duration-300 ${
                    isActive ? 'bg-yellow-accent text-[#0B0F19]' : 'bg-white/[0.04] text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <span className="block text-xs font-bold leading-tight">{cat.name}</span>
                  <span className="block text-[10px] text-slate-500 leading-none mt-0.5">
                    {cat.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 가이드 그리드 */}
      <section
        aria-label="가이드 목록"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow relative z-10"
      >
        {isLoading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-yellow-accent border-t-transparent animate-spin"
              aria-hidden="true"
            />
            <span className="text-xs text-slate-400 font-semibold">도로 위 지도 로딩 중...</span>
          </div>
        ) : contents.length === 0 ? (
          <div className="w-full py-20 rounded-3xl glass-panel text-center flex flex-col items-center justify-center border border-white/[0.05]">
            <HelpCircle className="w-12 h-12 text-slate-600 mb-4" aria-hidden="true" />
            <p className="text-base font-bold text-slate-300 mb-1">
              일치하는 가이드를 찾지 못했어요
            </p>
            <p className="text-xs text-slate-500 max-w-sm mb-6">
              검색어나 카테고리를 바꿔보시거나, 우측 하단의 AI 챗봇에게 자연어로 질문해보세요!
            </p>
            <button
              onClick={() => { setSearchQuery(''); handleCategoryChange('all'); }}
              className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors"
            >
              전체 가이드 보기
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.map((post) => {
                const catInfo = CATEGORIES.find((c) => c.id === post.category) ?? CATEGORIES[0];
                const CatIcon = catInfo.icon;
                return (
                  <article
                    key={post.id}
                    className="rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-yellow-accent/40 p-5 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(252,211,77,0.03)]"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] text-[10px] font-bold text-slate-300">
                          <CatIcon className="w-3 h-3 text-yellow-accent" aria-hidden="true" />
                          {catInfo.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-slate-100 group-hover:text-yellow-accent transition-colors duration-300 line-clamp-2 mb-2 leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4 font-medium">
                        {post.content.replace(/[#*`_-]/g, '').trim()}
                      </p>
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-4" aria-label="태그">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-semibold text-slate-500 bg-[#121824] px-2 py-0.5 rounded border border-white/[0.02]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/content/${post.slug}`}
                        className="w-full flex items-center justify-center gap-1.5 h-[42px] rounded-xl bg-white/[0.03] border border-white/[0.06] group-hover:bg-yellow-accent group-hover:text-[#0B0F19] text-xs font-bold text-slate-300 group-hover:border-transparent transition-all duration-300"
                      >
                        실전 노하우 읽기
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {meta.totalPages > 1 && (
              <nav aria-label="가이드 목록 페이지 이동" className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="이전 페이지"
                  className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-bold text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ←
                </button>
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    aria-current={p === currentPage ? 'page' : undefined}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      p === currentPage
                        ? 'bg-yellow-accent text-[#0B0F19]'
                        : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={currentPage === meta.totalPages}
                  aria-label="다음 페이지"
                  className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-bold text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  →
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      <ChatbotWidget />
    </div>
  );
}
