'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  ChevronRight, 
  BookOpen,
  Car,
  MapPin,
  Wrench,
  ShieldAlert,
  FileText
} from 'lucide-react';

interface GuideContent {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
}

const CATEGORIES = [
  { id: 'license', name: '면허 취득 가이드', icon: FileText },
  { id: 'basics', name: '운전 기본기', icon: Car },
  { id: 'rules', name: '도로 법규 · 신호', icon: MapPin },
  { id: 'management', name: '차량 관리 · 생활', icon: Wrench },
  { id: 'accidents', name: '사고 · 이슈 대처', icon: ShieldAlert },
];

/**
 * 간단하고 빠른 한국어 마크다운 파서 및 HTML 렌더러 헬퍼 함수
 */
function renderMarkdown(md: string) {
  if (!md) return '';

  const lines = md.split('\n');
  const htmlResult: string[] = [];

  let inList = false;

  for (const line of lines) {
    // 1. 순서 없는 리스트 처리 (- ...)
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) {
        htmlResult.push('<ul class="list-disc list-inside ml-4 space-y-2 mb-4 text-slate-300 font-medium">');
        inList = true;
      }
      const listContent = line.replace(/^-\s+|^\*\s+/, '');
      htmlResult.push(`<li class="leading-relaxed text-slate-300">${parseInlineMarkdown(listContent)}</li>`);
      continue;
    } else {
      if (inList) {
        htmlResult.push('</ul>');
        inList = false;
      }
    }

    // 2. 제목 (###, ##, #)
    if (line.startsWith('### ')) {
      htmlResult.push(`<h4 class="text-sm font-black text-yellow-accent mt-6 mb-3 tracking-tight">${parseInlineMarkdown(line.substring(4))}</h4>`);
    } else if (line.startsWith('## ')) {
      htmlResult.push(`<h3 class="text-base font-extrabold text-white mt-8 mb-4 border-b border-white/[0.05] pb-2 tracking-tight">${parseInlineMarkdown(line.substring(3))}</h3>`);
    } else if (line.startsWith('# ')) {
      htmlResult.push(`<h2 class="text-xl font-black text-white mt-10 mb-5 tracking-tight">${parseInlineMarkdown(line.substring(2))}</h2>`);
    }
    // 3. 인용구 (> ...)
    else if (line.startsWith('> ')) {
      htmlResult.push(`<blockquote class="border-l-4 border-yellow-accent bg-white/[0.02] pl-4 py-3 pr-2.5 rounded-r-xl text-slate-400 font-medium italic my-5 leading-relaxed text-xs">${parseInlineMarkdown(line.substring(2))}</blockquote>`);
    }
    // 4. 공백 줄
    else if (line.trim() === '') {
      htmlResult.push('<div class="h-4"></div>');
    }
    // 5. 일반 문단
    else {
      htmlResult.push(`<p class="text-slate-300 leading-relaxed font-medium mb-4 text-xs sm:text-[13px]">${parseInlineMarkdown(line)}</p>`);
    }
  }

  if (inList) {
    htmlResult.push('</ul>');
  }

  return htmlResult.join('');
}

/**
 * 인라인 볼드(**), 하이라이트(`), 기울임(*) 파싱
 */
function parseInlineMarkdown(text: string) {
  let parsed = text;
  
  // 1. 볼드 (**text**)
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>');
  
  // 2. 백틱 코드 하이라이트 (`code`)
  parsed = parsed.replace(/`(.*?)`/g, '<code class="bg-[#1e293b]/70 border border-white/5 text-yellow-accent px-1.5 py-0.5 rounded text-[11px] font-mono">$1</code>');
  
  return parsed;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ContentDetailPage({ params }: PageProps) {
  // Promise 언랩
  const { slug } = use(params);

  const [post, setPost] = useState<GuideContent | null>(null);
  const [recommendations, setRecommendations] = useState<GuideContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // slug가 변경될 때마다 상세 데이터를 다시 로드 (취소 가능 패턴)
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = (await api.getContentBySlug(slug)) as GuideContent;
        if (cancelled) return;
        setPost(data);

        const related = (await api.getContents(data.category)) as GuideContent[];
        if (cancelled) return;
        const filtered = related
          .filter((item) => item.id !== data.id)
          .slice(0, 3);
        setRecommendations(filtered);
      } catch (err) {
        console.error('글 상세정보 로드 에러:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="w-full flex-grow flex flex-col items-center justify-center py-40 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-yellow-accent border-t-transparent animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">실생활 꿀팁 로드 중...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-md mx-auto my-20 text-center glass-panel p-8 rounded-3xl border border-white/5">
        <span className="text-3xl block mb-4">⚠️</span>
        <h3 className="text-base font-bold text-slate-200 mb-2">해당 가이드를 찾을 수 없습니다</h3>
        <p className="text-xs text-slate-500 mb-6">존재하지 않거나 삭제된 가이드 글입니다.</p>
        <Link href="/" className="px-5 py-2.5 rounded-xl btn-yellow-glow text-xs font-bold inline-block">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const catInfo = CATEGORIES.find(c => c.id === post.category) || CATEGORIES[0];
  const CatIcon = catInfo.icon;

  return (
    <div className="relative w-full flex flex-col min-h-screen bg-[#0B0F19] py-10">
      {/* 백그라운드 데코 */}
      <div className="absolute top-0 right-10 w-[500px] h-[500px] rounded-full bg-yellow-accent/4 blur-[130px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        {/* 상단 뒤로가기 브레드크럼 */}
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

        {/* 글 본문 헤더 */}
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

          {/* 마크다운 렌더링 본문 */}
          <div 
            className="prose prose-invert max-w-none text-slate-300 font-medium"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />
        </article>

        {/* 3. 연관 콘텐츠 추천 (F1 기능 완벽 충족) */}
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
