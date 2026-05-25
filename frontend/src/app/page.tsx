'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  BookOpen, 
  HelpCircle, 
  Search, 
  MessageSquare, 
  Send, 
  X, 
  ChevronRight, 
  Car, 
  ShieldAlert, 
  Wrench, 
  MapPin, 
  FileText,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

// 카테고리 정보 정의
const CATEGORIES = [
  { id: 'all', name: '전체 가이드', icon: BookOpen, desc: '도로 위의 모든 실생활 노하우' },
  { id: 'license', name: '면허 취득 가이드', icon: FileText, desc: '학원비 절약 팁부터 취득 절차까지' },
  { id: 'basics', name: '운전 기본기', icon: Car, desc: '페달 조작, 룸미러 세팅, 주차 공식' },
  { id: 'rules', name: '도로 법규 · 신호', icon: MapPin, desc: '헷갈리는 비보호 및 실전 매너' },
  { id: 'management', name: '차량 관리 · 생활', icon: Wrench, desc: '셀프 주유, 자동 세차, 주기적 소모품' },
  { id: 'accidents', name: '사고 · 이슈 대처', icon: ShieldAlert, desc: '접촉사고 5단계 절차 및 과태료 대처' },
];

interface GuideContent {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
}

interface Message {
  id?: string;
  sender: 'user' | 'bot';
  text: string;
  sources?: { id: string; title: string; slug: string }[];
  feedback?: 'like' | 'dislike' | 'none';
}

export default function Home() {
  // 가이드 및 검색 상태
  const [contents, setContents] = useState<GuideContent[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 챗봇 인터페이스 상태
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  // useState lazy initializer로 effect 안의 setState 회피 (React 19 권고).
  // substr 메서드는 deprecated이므로 substring을 사용한다.
  const [sessionKey] = useState<string>(
    () => `session_${Math.random().toString(36).substring(2, 11)}`
  );
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatTyping, setIsChatTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 콘텐츠 불러오기 (useEffect 이전에 선언 → React 19 hooks 규칙 준수)
  const fetchContents = async (cat = 'all', q = '') => {
    setLoading(true);
    try {
      const categoryParam = cat === 'all' ? undefined : cat;
      const searchParam = q.trim() || undefined;
      const data = (await api.getContents(categoryParam, searchParam)) as GuideContent[];
      setContents(data);
    } catch (err) {
      console.error('가이드 글 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 대화 스크롤 아래로 내리기
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatTyping]);

  // 최초 가이드 데이터 로딩 (마운트 1회)
  useEffect(() => {
    fetchContents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 카테고리 탭 변경
  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    fetchContents(catId, searchQuery);
  };

  // 검색 전송
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContents(activeCategory, searchQuery);
  };

  // 챗봇 대화 전송
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatTyping) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    
    // 1. 사용자 메시지 리스트에 노출
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsChatTyping(true);

    try {
      // 2. 백엔드 API 전송
      const res = await api.askChat(userMsg, sessionKey);
      
      // 3. 챗봇의 다정한 응답 리스트에 추가
      setChatMessages(prev => [
        ...prev, 
        { 
          id: res.id,
          sender: 'bot', 
          text: res.botResponse,
          sources: res.matchedSources || []
        }
      ]);
    } catch (err) {
      console.error('챗봇 에러:', err);
      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'bot', 
          text: '죄송합니다. 네트워크 상태가 불안정하여 답변을 전송받지 못했습니다. 잠시 후 다시 시도해 주세요! 😢' 
        }
      ]);
    } finally {
      setIsChatTyping(false);
    }
  };

  // 챗봇 피드백 전송
  const handleFeedback = async (msgIndex: number, logId: string, feedbackType: 'like' | 'dislike') => {
    try {
      const msg = chatMessages[msgIndex];
      // 이미 한 피드백과 같으면 취소(none) 혹은 다른 피드백으로 변경
      const newFeedback = msg.feedback === feedbackType ? 'none' : feedbackType;
      
      await api.sendFeedback(logId, newFeedback);
      
      setChatMessages(prev => {
        const updated = [...prev];
        updated[msgIndex] = { ...updated[msgIndex], feedback: newFeedback };
        return updated;
      });
    } catch (err) {
      console.error('피드백 전송 실패:', err);
    }
  };

  return (
    <div className="relative w-full flex flex-col min-h-screen bg-[#0B0F19]">
      {/* 백그라운드 디자인 데코 레이션 */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-yellow-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-1/4 w-[400px] h-[400px] rounded-full bg-yellow-accent/3 blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-accent/10 border border-yellow-accent/20 text-yellow-accent text-xs font-bold tracking-wide uppercase mb-6 animate-pulse">
          🔰 면허 학원도 알려주지 않는 실전 팁
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
          초보운전자가 <br className="sm:hidden" />
          진짜 <span className="text-yellow-gradient">막막한 순간</span>의 등대
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 font-medium mb-10 leading-relaxed">
          유튜브 브이로그나 두꺼운 공식 교본 말고, 도로 위에서 당황스럽게 헷갈릴 때 <br className="hidden sm:inline" />
          즉시 꺼내볼 수 있는 맞춤 실생활 가이드와 다정한 RAG 챗봇을 만나보세요.
        </p>

        {/* 통합 검색바 */}
        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto relative mb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="비보호 좌회전, 주차 요령, 접촉사고 대처 방법..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-28 rounded-2xl bg-white/[0.03] border border-white/[0.08] focus:border-yellow-accent focus:bg-white/[0.05] focus:outline-none text-slate-200 text-sm font-semibold transition-all shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-2 px-5 py-2.5 rounded-xl btn-yellow-glow text-xs font-bold"
            >
              검색하기
            </button>
          </div>
        </form>
        
        <div className="text-xs text-slate-500 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>인기 검색어:</span>
          <button onClick={() => { setSearchQuery('비보호 좌회전'); fetchContents(activeCategory, '비보호 좌회전'); }} className="hover:text-yellow-accent underline">비보호 좌회전</button>
          <span className="text-slate-800">•</span>
          <button onClick={() => { setSearchQuery('골목길 양보'); fetchContents(activeCategory, '골목길 양보'); }} className="hover:text-yellow-accent underline">골목길 양보</button>
          <span className="text-slate-800">•</span>
          <button onClick={() => { setSearchQuery('접촉사고'); fetchContents(activeCategory, '접촉사고'); }} className="hover:text-yellow-accent underline">접촉사고 대처</button>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
        <div className="flex overflow-x-auto pb-4 gap-3 scrollbar-none snap-x justify-start lg:justify-center">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`snap-start flex items-center gap-2.5 px-[18px] py-3.5 rounded-2xl shrink-0 border text-left cursor-pointer transition-all duration-300 ${
                  isActive
                    ? 'bg-yellow-accent/15 border-yellow-accent text-white shadow-[0_0_15px_rgba(252,211,77,0.1)]'
                    : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors duration-300 ${
                  isActive ? 'bg-yellow-accent text-[#0B0F19]' : 'bg-white/[0.04] text-slate-300'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">{cat.name}</h4>
                  <p className="text-[10px] text-slate-500 leading-none mt-0.5">{cat.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Contents Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow relative z-10">
        {loading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-yellow-accent border-t-transparent animate-spin" />
            <span className="text-xs text-slate-400 font-semibold">도로 위 지도 로딩 중...</span>
          </div>
        ) : contents.length === 0 ? (
          <div className="w-full py-20 rounded-3xl glass-panel text-center flex flex-col items-center justify-center border border-white/[0.05]">
            <HelpCircle className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-base font-bold text-slate-300 mb-1">일치하는 가이드를 찾지 못했어요</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6">
              검색어나 카테고리를 바꿔보시거나, 오른쪽 하단의 **AI 챗봇 비서**에게 자연어로 질문해보세요!
            </p>
            <button
              onClick={() => { setSearchQuery(''); handleCategoryChange('all'); }}
              className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors"
            >
              전체 가이드 보기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map((post) => {
              const catInfo = CATEGORIES.find(c => c.id === post.category) || CATEGORIES[0];
              const CatIcon = catInfo.icon;
              return (
                <article
                  key={post.id}
                  className="rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-yellow-accent/40 p-5 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(252,211,77,0.03)]"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] text-[10px] font-bold text-slate-300">
                        <CatIcon className="w-3 h-3 text-yellow-accent" />
                        {catInfo.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 group-hover:text-yellow-accent transition-colors duration-300 line-clamp-2 mb-2 leading-snug">
                      {post.title}
                    </h3>
                    
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4 font-medium">
                      {post.content.replace(/[#*`_-]/g, '').trim()}
                    </p>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.tags.map((tag, idx) => (
                        <span key={idx} className="text-[9px] font-semibold text-slate-500 bg-[#121824] px-2 py-0.5 rounded border border-white/[0.02]">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/content/${post.slug}`}
                      className="w-full flex items-center justify-center gap-1.5 h-[42px] rounded-xl bg-white/[0.03] border border-white/[0.06] group-hover:bg-yellow-accent group-hover:text-[#0B0F19] text-xs font-bold text-slate-300 group-hover:border-transparent transition-all duration-300"
                    >
                      실전 노하우 읽기
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating AI Chatbot Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] flex items-center justify-center text-[#0B0F19] shadow-[0_4px_20px_rgba(252,211,77,0.3)] hover:scale-105 active:scale-95 cursor-pointer transition-transform duration-300"
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>

        {/* Chat Dialog — 모바일: 뷰포트 가득, 데스크톱: 우하단 고정 */}
        {isChatOpen && (
          <div className="fixed left-2 right-2 bottom-[76px] max-h-[80dvh] sm:fixed sm:left-auto sm:right-6 sm:bottom-[88px] sm:w-[400px] sm:max-h-none sm:h-[520px] rounded-3xl glass-panel border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            {/* Chat Header */}
            <div className="bg-[#121825] px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-yellow-accent/15 flex items-center justify-center font-bold text-yellow-accent">
                  🌳
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">DriveTree AI 길잡이</h3>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    실시간 RAG 어댑터 활성화
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body (Messages) */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 flex flex-col">
              {chatMessages.length === 0 && (
                <div className="my-auto text-center px-4">
                  <span className="inline-block text-2xl mb-2">🚗💛</span>
                  <h4 className="text-xs font-bold text-slate-300 mb-1.5">도로 위 막막함을 대화로 해결해보세요</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                    &ldquo;비보호 우회전할 때 신호 걸리면?&rdquo;, &ldquo;골목길 양보 우선순위는?&rdquo;, &ldquo;가벼운 주차장 접촉사고 대처 방법은?&rdquo; 등 도로 위 무엇이든 자연어로 질문해보세요!
                  </p>
                </div>
              )}

              {chatMessages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser 
                        ? 'bg-[#1E293B] text-slate-100 rounded-tr-none'
                        : 'bg-white/[0.03] border border-white/[0.06] text-slate-200 rounded-tl-none font-medium'
                    }`}>
                      {msg.text}
                      
                      {/* 매칭된 출처 카드 링크 */}
                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-white/[0.05] space-y-1.5">
                          <span className="text-[9px] text-yellow-accent font-bold uppercase tracking-wider block">
                            💡 추천 가이드 출처
                          </span>
                          {msg.sources.map((src) => (
                            <Link
                              key={src.id}
                              href={`/content/${src.slug}`}
                              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-yellow-accent/10 border border-white/[0.04] text-[10px] font-bold text-slate-300 hover:text-yellow-accent transition-all duration-200"
                            >
                              <span className="truncate">{src.title}</span>
                              <ChevronRight className="w-3 h-3 shrink-0" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 피드백 및 메타 영역 */}
                    {!isUser && msg.id && (
                      <div className="flex items-center gap-2 mt-1.5 ml-2.5">
                        <button
                          onClick={() => handleFeedback(index, msg.id!, 'like')}
                          className={`p-1 rounded hover:bg-white/5 transition-colors ${
                            msg.feedback === 'like' ? 'text-yellow-accent' : 'text-slate-600 hover:text-slate-400'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(index, msg.id!, 'dislike')}
                          className={`p-1 rounded hover:bg-white/5 transition-colors ${
                            msg.feedback === 'dislike' ? 'text-red-400' : 'text-slate-600 hover:text-slate-400'
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {isChatTyping && (
                <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-none px-[18px] py-3 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Footer (Input) */}
            <form onSubmit={handleSendChat} className="p-3 bg-[#121825] border-t border-white/[0.06] flex items-center gap-2">
              <input
                type="text"
                placeholder="도로 위 궁금한 점을 적어주세요..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatTyping}
                className="flex-grow h-[42px] px-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-semibold focus:outline-none focus:border-yellow-accent text-slate-200"
              />
              <button
                type="submit"
                disabled={isChatTyping || !chatInput.trim()}
                className="w-[42px] h-[42px] rounded-xl btn-yellow-glow flex items-center justify-center disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-transform"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
