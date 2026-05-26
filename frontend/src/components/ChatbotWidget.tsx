'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, X, Send, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import type { ChatMessage } from '@/types';

const ERROR_TEXT =
  '죄송합니다. 네트워크 상태가 불안정하여 답변을 전송받지 못했습니다. 잠시 후 다시 시도해 주세요!';

const RATE_LIMIT_TEXT =
  '잠시 질문이 너무 많아요! 1분 후에 다시 시도해 주세요. 🙏';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionKey] = useState<string>(
    () => `session_${Math.random().toString(36).substring(2, 11)}`,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMsg = input.trim();
    if (!userMsg || isTyping) return;

    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const res = await api.askChat(userMsg, sessionKey);
      setMessages((prev) => [
        ...prev,
        {
          id: res.id,
          sender: 'bot',
          text: res.botResponse,
          sources: res.matchedSources ?? [],
        },
      ]);
    } catch (err) {
      const text =
        err instanceof ApiError && err.isRateLimit() ? RATE_LIMIT_TEXT : ERROR_TEXT;
      setMessages((prev) => [...prev, { sender: 'bot', text }]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendFeedback = async (
    msgIndex: number,
    logId: string,
    feedbackType: 'like' | 'dislike',
  ) => {
    const current = messages[msgIndex]?.feedback;
    const next = current === feedbackType ? 'none' : feedbackType;
    try {
      await api.sendFeedback(logId, next);
      setMessages((prev) => {
        const updated = [...prev];
        updated[msgIndex] = { ...updated[msgIndex], feedback: next };
        return updated;
      });
    } catch {
      // 피드백 실패는 사용자 흐름에 영향 없으므로 조용히 처리
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 플로팅 토글 버튼 */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'AI 챗봇 닫기' : 'AI 챗봇 열기'}
        aria-expanded={isOpen}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] flex items-center justify-center text-[#0B0F19] shadow-[0_4px_20px_rgba(252,211,77,0.3)] hover:scale-105 active:scale-95 transition-transform duration-300"
      >
        {isOpen ? (
          <X className="w-6 h-6" aria-hidden="true" />
        ) : (
          <MessageSquare className="w-6 h-6" aria-hidden="true" />
        )}
      </button>

      {/* 채팅 다이얼로그 */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="DriveTree AI 챗봇"
          className="fixed left-2 right-2 bottom-[76px] max-h-[80dvh] sm:fixed sm:left-auto sm:right-6 sm:bottom-[88px] sm:w-[400px] sm:max-h-none sm:h-[520px] rounded-3xl glass-panel border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
        >
          {/* 헤더 */}
          <div className="bg-[#121825] px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg bg-yellow-accent/15 flex items-center justify-center font-bold text-yellow-accent"
                aria-hidden="true"
              >
                🌳
              </div>
              <div>
                <p className="text-xs font-bold text-white">DriveTree AI 길잡이</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                    aria-hidden="true"
                  />
                  실시간 RAG 어댑터 활성화
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="챗봇 닫기"
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 flex flex-col">
            {messages.length === 0 && (
              <div className="my-auto text-center px-4">
                <span className="inline-block text-2xl mb-2" aria-hidden="true">
                  🚗💛
                </span>
                <p className="text-xs font-bold text-slate-300 mb-1.5">
                  도로 위 막막함을 대화로 해결해보세요
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  &ldquo;비보호 우회전할 때 신호 걸리면?&rdquo;, &ldquo;골목길 양보
                  우선순위는?&rdquo; 등 도로 위 무엇이든 자연어로 질문해보세요!
                </p>
              </div>
            )}

            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={index}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-[#1E293B] text-slate-100 rounded-tr-none'
                        : 'bg-white/[0.03] border border-white/[0.06] text-slate-200 rounded-tl-none font-medium'
                    }`}
                  >
                    {msg.text}

                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-white/[0.05] space-y-1.5">
                        <span className="text-[10px] text-yellow-accent font-bold uppercase tracking-wider block">
                          💡 추천 가이드 출처
                        </span>
                        {msg.sources.map((src) => (
                          <Link
                            key={src.id}
                            href={`/content/${src.slug}`}
                            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-yellow-accent/10 border border-white/[0.04] text-[10px] font-bold text-slate-300 hover:text-yellow-accent transition-all duration-200"
                          >
                            <span className="truncate">{src.title}</span>
                            <ChevronRight className="w-3 h-3 shrink-0" aria-hidden="true" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isUser && msg.id && (
                    <div className="flex items-center gap-2 mt-1.5 ml-2.5">
                      <button
                        onClick={() => sendFeedback(index, msg.id!, 'like')}
                        aria-label="답변이 도움됐어요"
                        aria-pressed={msg.feedback === 'like'}
                        className={`p-1 rounded hover:bg-white/5 transition-colors ${
                          msg.feedback === 'like'
                            ? 'text-yellow-accent'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => sendFeedback(index, msg.id!, 'dislike')}
                        aria-label="답변이 도움 안 됐어요"
                        aria-pressed={msg.feedback === 'dislike'}
                        className={`p-1 rounded hover:bg-white/5 transition-colors ${
                          msg.feedback === 'dislike'
                            ? 'text-red-400'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div
                aria-label="답변 생성 중"
                className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-none px-[18px] py-3 w-fit"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-yellow-accent animate-bounce"
                  style={{ animationDelay: '0ms' }}
                  aria-hidden="true"
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-yellow-accent animate-bounce"
                  style={{ animationDelay: '150ms' }}
                  aria-hidden="true"
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-yellow-accent animate-bounce"
                  style={{ animationDelay: '300ms' }}
                  aria-hidden="true"
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <form
            onSubmit={sendMessage}
            className="p-3 bg-[#121825] border-t border-white/[0.06] flex items-center gap-2"
          >
            <label htmlFor="chat-input" className="sr-only">
              질문 입력
            </label>
            <input
              id="chat-input"
              type="text"
              placeholder="도로 위 궁금한 점을 적어주세요..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-grow h-[42px] px-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-semibold focus:outline-none focus:border-yellow-accent text-slate-200 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              aria-label="질문 전송"
              className="w-[42px] h-[42px] rounded-xl btn-yellow-glow flex items-center justify-center disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-transform"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
