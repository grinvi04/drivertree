'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
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

  return (
    <>
      {/* ── Hero Section — Pure White ───────────────────────────────── */}
      <section
        className="w-full text-center px-5 pt-20 pb-16"
        style={{ background: "var(--canvas)" }}
      >
        <div className="max-w-[680px] mx-auto">
          <p
            className="text-[17px] font-semibold mb-5"
            style={{ color: "var(--primary)", letterSpacing: "-0.374px" }}
          >
            초보운전자 가이드 &amp; AI 챗봇
          </p>

          <h1
            className="font-semibold mb-5"
            style={{
              fontSize: "clamp(34px, 5vw, 56px)",
              lineHeight: 1.07,
              letterSpacing: "-0.28px",
              color: "var(--ink)",
            }}
          >
            도로 위 막막한 순간,<br />
            DriveTree가 함께합니다
          </h1>

          <p
            className="mb-10"
            style={{
              fontSize: "17px",
              fontWeight: 400,
              lineHeight: 1.47,
              letterSpacing: "-0.374px",
              color: "var(--ink-muted-80)",
            }}
          >
            비보호 좌회전, 접촉사고, 범칙금까지 — 면허 학원도<br className="hidden sm:inline" />
            알려주지 않는 실전 노하우를 한곳에서 확인하세요.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="#guides" className="btn-primary">가이드 살펴보기</a>
            <Link href="/calculators" className="btn-ghost">계산기 바로가기</Link>
          </div>
        </div>
      </section>

      {/* ── Search Section — Parchment ──────────────────────────────── */}
      <section
        id="guides"
        className="w-full px-5 pt-12 pb-4"
        style={{ background: "var(--canvas-parchment)" }}
      >
        <div className="max-w-[680px] mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
              style={{ color: "var(--ink-muted-48)" }}
              aria-hidden="true"
            />
            <label htmlFor="guide-search" className="sr-only">가이드 검색</label>
            <input
              id="guide-search"
              type="text"
              placeholder="비보호 좌회전, 주차, 접촉사고 대처..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-28 text-[17px] focus:outline-none"
              style={{
                background: "var(--canvas)",
                border: "1px solid var(--hairline)",
                borderRadius: "9999px",
                color: "var(--ink)",
                letterSpacing: "-0.374px",
              }}
            />
            <button
              type="submit"
              aria-label="가이드 검색하기"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-primary"
              style={{ fontSize: "14px", padding: "8px 16px" }}
            >
              검색하기
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 px-1">
            <span className="text-[12px]" style={{ color: "var(--ink-muted-48)" }}>인기:</span>
            {POPULAR_SEARCHES.map((term, idx) => (
              <span key={term} className="contents">
                {idx > 0 && <span className="text-[12px]" style={{ color: "var(--hairline)" }}>·</span>}
                <button
                  onClick={() => { setSearchQuery(term); setSubmittedQuery(term); }}
                  aria-label={`${term} 검색하기`}
                  className="text-[12px] hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  {term}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Category chips */}
        <div className="max-w-[980px] mx-auto mt-8">
          <div
            role="group"
            aria-label="가이드 카테고리"
            className="flex overflow-x-auto gap-2 pb-2 scrollbar-none justify-start lg:justify-center"
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  aria-pressed={isActive}
                  aria-label={`${cat.name} 카테고리 선택`}
                  className="shrink-0 px-4 py-2 text-[14px] font-medium transition-all"
                  style={{
                    borderRadius: "9999px",
                    border: `1px solid ${isActive ? "var(--primary)" : "var(--hairline)"}`,
                    background: isActive ? "var(--primary)" : "var(--canvas)",
                    color: isActive ? "#ffffff" : "var(--ink-muted-80)",
                    letterSpacing: "-0.224px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Content Grid — Parchment (continued) ───────────────────── */}
      <section
        className="w-full px-5 pt-6 pb-20 flex-grow"
        style={{ background: "var(--canvas-parchment)" }}
        aria-label="가이드 목록"
      >
        <div className="max-w-[980px] mx-auto">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center gap-3">
              <div
                className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
                aria-hidden="true"
              />
              <span className="text-[14px]" style={{ color: "var(--ink-muted-48)" }}>로딩 중...</span>
            </div>
          ) : contents.length === 0 ? (
            <div
              className="py-24 rounded-[18px] text-center flex flex-col items-center border"
              style={{ background: "var(--canvas)", borderColor: "var(--hairline)" }}
            >
              <p className="text-[17px] font-semibold mb-2" style={{ color: "var(--ink)", letterSpacing: "-0.374px" }}>
                일치하는 가이드가 없습니다
              </p>
              <p className="text-[14px] mb-6" style={{ color: "var(--ink-muted-48)", letterSpacing: "-0.224px" }}>
                검색어나 카테고리를 바꿔보거나, AI 챗봇에 질문해보세요.
              </p>
              <button
                onClick={() => { setSearchQuery(''); handleCategoryChange('all'); }}
                className="btn-primary"
                style={{ fontSize: "14px", padding: "8px 20px" }}
              >
                전체 가이드 보기
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {contents.map((post) => {
                  const catInfo = CATEGORIES.find((c) => c.id === post.category) ?? CATEGORIES[0];
                  return (
                    <article
                      key={post.id}
                      className="utility-card flex flex-col justify-between transition-shadow hover:shadow-sm"
                    >
                      <div>
                        {/* Category + date */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              background: "var(--canvas-parchment)",
                              color: "var(--ink-muted-80)",
                              letterSpacing: "-0.12px",
                            }}
                          >
                            {catInfo.name}
                          </span>
                          <span className="text-[12px]" style={{ color: "var(--ink-muted-48)" }}>
                            {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>

                        {/* Title */}
                        <h2
                          className="font-semibold mb-2 line-clamp-2 leading-snug"
                          style={{
                            fontSize: "17px",
                            color: "var(--ink)",
                            letterSpacing: "-0.374px",
                          }}
                        >
                          {post.title}
                        </h2>

                        {/* Excerpt */}
                        <p
                          className="line-clamp-3 mb-4"
                          style={{
                            fontSize: "14px",
                            lineHeight: 1.43,
                            color: "var(--ink-muted-80)",
                            letterSpacing: "-0.224px",
                          }}
                        >
                          {post.content.replace(/[#*`_\-]/g, '').trim()}
                        </p>
                      </div>

                      {/* Tags + CTA */}
                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-4" aria-label="태그">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[12px] px-2 py-0.5"
                              style={{
                                background: "var(--canvas-parchment)",
                                color: "var(--ink-muted-48)",
                                borderRadius: "4px",
                                letterSpacing: "-0.12px",
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={`/content/${post.slug}`}
                          className="text-[17px] font-medium hover:underline"
                          style={{ color: "var(--primary)", letterSpacing: "-0.374px" }}
                        >
                          자세히 보기
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <nav aria-label="가이드 목록 페이지 이동" className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="이전 페이지"
                    className="px-4 py-2 text-[14px] transition-colors disabled:opacity-30"
                    style={{
                      background: "var(--canvas)",
                      border: "1px solid var(--hairline)",
                      borderRadius: "8px",
                      color: "var(--ink-muted-80)",
                    }}
                  >
                    ←
                  </button>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      aria-current={p === currentPage ? 'page' : undefined}
                      className="w-9 h-9 text-[14px] font-medium transition-colors"
                      style={{
                        background: p === currentPage ? "var(--primary)" : "var(--canvas)",
                        border: `1px solid ${p === currentPage ? "var(--primary)" : "var(--hairline)"}`,
                        borderRadius: "8px",
                        color: p === currentPage ? "#fff" : "var(--ink-muted-80)",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={currentPage === meta.totalPages}
                    aria-label="다음 페이지"
                    className="px-4 py-2 text-[14px] transition-colors disabled:opacity-30"
                    style={{
                      background: "var(--canvas)",
                      border: "1px solid var(--hairline)",
                      borderRadius: "8px",
                      color: "var(--ink-muted-80)",
                    }}
                  >
                    →
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── AI Chatbot CTA — Dark Tile ──────────────────────────────── */}
      <section
        className="w-full text-center px-5 py-20 tile-dark"
      >
        <div className="max-w-[580px] mx-auto">
          <p
            className="text-[17px] font-semibold mb-4"
            style={{ color: "var(--primary-on-dark)", letterSpacing: "-0.374px" }}
          >
            AI 챗봇
          </p>
          <h2
            className="font-semibold mb-5 text-white"
            style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.10, letterSpacing: "-0.01em" }}
          >
            가이드에 없는 궁금증도<br />자연어로 바로 해결
          </h2>
          <p
            className="mb-8"
            style={{
              fontSize: "17px",
              lineHeight: 1.47,
              letterSpacing: "-0.374px",
              color: "var(--body-muted)",
            }}
          >
            TF-IDF 기반 로컬 NLP 엔진이 6개 가이드 DB를<br className="hidden sm:inline" />
            탐색해 가장 관련 높은 답변을 제공합니다.
          </p>
          <p className="text-[14px]" style={{ color: "var(--ink-muted-48)" }}>
            오른쪽 하단 💬 버튼을 눌러 대화를 시작하세요
          </p>
        </div>
      </section>

      <ChatbotWidget />
    </>
  );
}
