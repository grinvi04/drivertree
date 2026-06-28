import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, ChevronRight, BookOpen } from 'lucide-react';
import type { GuideContent, PaginatedResult } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { renderMarkdownSafe } from '@/lib/markdown';

export const revalidate = 3600;
export const dynamicParams = true;

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(`${BASE}/content?page=1&limit=100`);
    if (!res.ok) return [];
    const data = (await res.json()) as PaginatedResult<GuideContent>;
    return data.data.map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
}

async function getContent(slug: string): Promise<GuideContent | null> {
  const res = await fetch(`${BASE}/content/slug/${slug}`, {
    next: { revalidate: 3600 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('콘텐츠 로드 실패');
  return res.json() as Promise<GuideContent>;
}

async function getRelated(
  category: string,
  excludeId: string,
): Promise<GuideContent[]> {
  try {
    const res = await fetch(
      `${BASE}/content?category=${encodeURIComponent(category)}&page=1&limit=10`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as PaginatedResult<GuideContent>;
    return data.data.filter((item) => item.id !== excludeId).slice(0, 3);
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ContentDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await getContent(slug);
  if (!post) notFound();

  const recommendations = await getRelated(post.category, post.id);

  const sanitizedHtml = renderMarkdownSafe(post.content);

  const catInfo = CATEGORIES.find((c) => c.id === post.category) ?? CATEGORIES[0];
  const CatIcon = catInfo.icon;

  return (
    <div className="w-full min-h-screen" style={{ background: "var(--canvas)" }}>
      {/* Article */}
      <div className="max-w-[740px] mx-auto px-5 pt-12 pb-20">
        {/* Back + category */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[14px] hover:underline"
            style={{ color: "var(--primary)", letterSpacing: "-0.224px" }}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            가이드 목록으로
          </Link>
          <span
            className="inline-flex items-center gap-1 px-3 py-1 text-[12px] font-medium"
            style={{
              background: "var(--canvas-parchment)",
              color: "var(--ink-muted-80)",
              borderRadius: "9999px",
              border: "1px solid var(--hairline)",
              letterSpacing: "-0.12px",
            }}
          >
            <CatIcon className="w-3 h-3" aria-hidden="true" />
            {catInfo.name}
          </span>
        </div>

        <article>
          {/* Meta */}
          <div className="flex items-center gap-4 mb-4" style={{ color: "var(--ink-muted-48)" }}>
            <span className="flex items-center gap-1 text-[12px]">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              {new Date(post.createdAt).toLocaleDateString('ko-KR')}
            </span>
            <span className="text-[12px] flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" aria-hidden="true" />
              {post.tags.join(', ')}
            </span>
          </div>

          {/* Title */}
          <h1
            className="font-semibold mb-10"
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              lineHeight: 1.10,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}
          >
            {post.title}
          </h1>

          {/* Divider */}
          <hr style={{ borderColor: "var(--hairline)", marginBottom: "32px" }} />

          {/* Body */}
          <div
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            style={{ fontFamily: "Inter, -apple-system, sans-serif", wordBreak: "keep-all", overflowWrap: "break-word" }}
          />
        </article>

        {/* Related */}
        {recommendations.length > 0 && (
          <div className="mt-16 pt-10" style={{ borderTop: "1px solid var(--hairline)" }}>
            <h3
              className="font-semibold mb-6 flex items-center gap-2"
              style={{ fontSize: "21px", color: "var(--ink)", letterSpacing: "0" }}
            >
              <BookOpen className="w-5 h-5" style={{ color: "var(--primary)" }} aria-hidden="true" />
              함께 읽으면 좋은 가이드
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/content/${rec.slug}`}
                  className="utility-card flex flex-col justify-between hover:shadow-sm transition-shadow"
                >
                  <h4
                    className="font-semibold line-clamp-2 leading-snug mb-3"
                    style={{ fontSize: "14px", color: "var(--ink)", letterSpacing: "-0.224px" }}
                  >
                    {rec.title}
                  </h4>
                  <div
                    className="flex items-center justify-between text-[14px]"
                    style={{ color: "var(--primary)", letterSpacing: "-0.224px" }}
                  >
                    <span>자세히 보기</span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
