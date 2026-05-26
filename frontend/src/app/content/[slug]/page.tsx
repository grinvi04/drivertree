import { notFound } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { ArrowLeft, Calendar, Tag, ChevronRight, BookOpen } from 'lucide-react';
import type { GuideContent, PaginatedResult } from '@/types';
import { CATEGORIES } from '@/constants/categories';

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseInlineMarkdown(text: string): string {
  let parsed = escapeHtml(text);
  parsed = parsed.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-extrabold text-white">$1</strong>',
  );
  parsed = parsed.replace(
    /`(.*?)`/g,
    '<code class="bg-[#1e293b]/70 border border-white/5 text-yellow-accent px-1.5 py-0.5 rounded text-[11px] font-mono">$1</code>',
  );
  return parsed;
}

function renderMarkdown(md: string): string {
  if (!md) return '';

  const lines = md.split('\n');
  const htmlResult: string[] = [];
  let inList = false;

  for (const line of lines) {
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) {
        htmlResult.push(
          '<ul class="list-disc list-inside ml-4 space-y-2 mb-4 text-slate-300 font-medium">',
        );
        inList = true;
      }
      const listContent = line.replace(/^-\s+|^\*\s+/, '');
      htmlResult.push(
        `<li class="leading-relaxed text-slate-300">${parseInlineMarkdown(listContent)}</li>`,
      );
      continue;
    } else if (inList) {
      htmlResult.push('</ul>');
      inList = false;
    }

    if (line.startsWith('### ')) {
      htmlResult.push(
        `<h4 class="text-sm font-black text-yellow-accent mt-6 mb-3 tracking-tight">${parseInlineMarkdown(line.substring(4))}</h4>`,
      );
    } else if (line.startsWith('## ')) {
      htmlResult.push(
        `<h3 class="text-base font-extrabold text-white mt-8 mb-4 border-b border-white/[0.05] pb-2 tracking-tight">${parseInlineMarkdown(line.substring(3))}</h3>`,
      );
    } else if (line.startsWith('# ')) {
      htmlResult.push(
        `<h2 class="text-xl font-black text-white mt-10 mb-5 tracking-tight">${parseInlineMarkdown(line.substring(2))}</h2>`,
      );
    } else if (line.startsWith('> ')) {
      htmlResult.push(
        `<blockquote class="border-l-4 border-yellow-accent bg-white/[0.02] pl-4 py-3 pr-2.5 rounded-r-xl text-slate-400 font-medium italic my-5 leading-relaxed text-xs">${parseInlineMarkdown(line.substring(2))}</blockquote>`,
      );
    } else if (line.trim() === '') {
      htmlResult.push('<div class="h-4"></div>');
    } else {
      htmlResult.push(
        `<p class="text-slate-300 leading-relaxed font-medium mb-4 text-xs sm:text-[13px]">${parseInlineMarkdown(line)}</p>`,
      );
    }
  }

  if (inList) htmlResult.push('</ul>');
  return htmlResult.join('');
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ContentDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await getContent(slug);
  if (!post) notFound();

  const recommendations = await getRelated(post.category, post.id);

  const sanitizedHtml = DOMPurify.sanitize(renderMarkdown(post.content), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'button', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  });

  const catInfo = CATEGORIES.find((c) => c.id === post.category) ?? CATEGORIES[0];
  const CatIcon = catInfo.icon;

  return (
    <div className="relative w-full flex flex-col min-h-screen bg-[#0B0F19] py-10 overflow-x-hidden">
      <div className="absolute top-0 right-10 w-[500px] h-[500px] rounded-full bg-yellow-accent/4 blur-[130px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-yellow-accent font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            가이드 목록으로
          </Link>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] text-[10px] font-extrabold text-slate-300">
            <CatIcon className="w-3.5 h-3.5 text-yellow-accent" />
            {catInfo.name}
          </span>
        </div>

        <article className="rounded-3xl glass-panel p-6 sm:p-10 border border-white/[0.06] mb-10 shadow-2xl">
          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
            <span className="text-slate-800">•</span>
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-600" />
              {post.tags.join(', ')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white mb-8 tracking-tight leading-snug">
            {post.title}
          </h1>

          <div
            className="prose prose-invert max-w-none text-slate-300 font-medium"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </article>

        {recommendations.length > 0 && (
          <div className="mt-12 border-t border-white/[0.05] pt-10">
            <h3 className="text-base font-extrabold text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-yellow-accent" />
              함께 읽으면 좋은 실전 팁
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/content/${rec.slug}`}
                  className="rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-yellow-accent/40 p-[18px] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300"
                >
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 mb-1.5 block">
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug mb-1">
                      {rec.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mt-4 pt-3.5 border-t border-white/[0.03]">
                    <span>자세히 보기</span>
                    <ChevronRight className="w-3 h-3" />
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
