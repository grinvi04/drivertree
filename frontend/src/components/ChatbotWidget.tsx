'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, X, Send, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { renderMarkdownSafe } from '@/lib/markdown';
import type { ChatMessage } from '@/types';

const ERROR_TEXT = '네트워크 상태가 불안정합니다. 잠시 후 다시 시도해 주세요.';
const RATE_LIMIT_TEXT = '질문이 너무 많습니다. 1분 후 다시 시도해 주세요.';

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
        { id: res.id, sender: 'bot', text: res.botResponse, sources: res.matchedSources ?? [] },
      ]);
    } catch (err) {
      const text = err instanceof ApiError && err.isRateLimit() ? RATE_LIMIT_TEXT : ERROR_TEXT;
      setMessages((prev) => [...prev, { sender: 'bot', text }]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendFeedback = async (msgIndex: number, logId: string, feedbackType: 'like' | 'dislike') => {
    const next = messages[msgIndex]?.feedback === feedbackType ? 'none' : feedbackType;
    try {
      await api.sendFeedback(logId, next);
      setMessages((prev) => {
        const updated = [...prev];
        updated[msgIndex] = { ...updated[msgIndex], feedback: next };
        return updated;
      });
    } catch { /* silent */ }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'AI 챗봇 닫기' : 'AI 챗봇 열기'}
        aria-expanded={isOpen}
        className="w-14 h-14 flex items-center justify-center transition-transform active:scale-95"
        style={{
          background: "var(--primary)",
          borderRadius: "9999px",
          color: "#ffffff",
          boxShadow: "0 4px 20px rgba(0,102,204,0.3)",
        }}
      >
        {isOpen
          ? <X className="w-6 h-6" aria-hidden="true" />
          : <MessageSquare className="w-6 h-6" aria-hidden="true" />
        }
      </button>

      {/* Chat dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="DriveTree AI 챗봇"
          className="fixed left-2 right-2 bottom-[76px] max-h-[80dvh] sm:fixed sm:left-auto sm:right-6 sm:bottom-[88px] sm:w-[380px] sm:max-h-none sm:h-[500px] flex flex-col overflow-hidden"
          style={{
            background: "var(--canvas)",
            border: "1px solid var(--hairline)",
            borderRadius: "18px",
            boxShadow: "rgba(0,0,0,0.12) 0 8px 40px",
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center justify-between flex-shrink-0"
            style={{ borderBottom: "1px solid var(--hairline)" }}
          >
            <div>
              <p
                className="font-semibold"
                style={{ fontSize: "17px", color: "var(--ink)", letterSpacing: "-0.374px" }}
              >
                DriveTree AI
              </p>
              <div className="flex items-center gap-1.5" style={{ fontSize: "12px", color: "var(--ink-muted-48)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" aria-hidden="true" />
                답변 준비 완료
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="챗봇 닫기"
              className="p-2 rounded-full transition-colors hover:bg-gray-100"
              style={{ color: "var(--ink-muted-48)" }}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 flex flex-col">
            {messages.length === 0 && (
              <div className="my-auto text-center px-4">
                <p
                  className="font-semibold mb-2"
                  style={{ fontSize: "17px", color: "var(--ink)", letterSpacing: "-0.374px" }}
                >
                  도로 위 궁금증을 물어보세요
                </p>
                <p style={{ fontSize: "14px", color: "var(--ink-muted-80)", lineHeight: 1.47, letterSpacing: "-0.224px" }}>
                  &ldquo;비보호 좌회전 신호 걸리면?&rdquo;,<br />
                  &ldquo;골목길 양보 우선순위는?&rdquo;
                </p>
              </div>
            )}

            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className="max-w-[85%] px-4 py-3"
                    style={{
                      background: isUser ? "var(--primary)" : "var(--canvas-parchment)",
                      color: isUser ? "#ffffff" : "var(--ink)",
                      borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      fontSize: "14px",
                      letterSpacing: "-0.224px",
                      lineHeight: 1.47,
                    }}
                  >
                    {isUser ? (
                      msg.text
                    ) : (
                      // 봇 답변은 콘텐츠 상세와 동일한 마크다운 렌더러(sanitize 포함) 재사용
                      <div
                        className="chat-markdown"
                        dangerouslySetInnerHTML={{ __html: renderMarkdownSafe(msg.text) }}
                      />
                    )}

                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: "1px solid var(--hairline)" }}>
                        <span
                          className="font-semibold block"
                          style={{ fontSize: "12px", color: "var(--primary)" }}
                        >
                          관련 가이드
                        </span>
                        {msg.sources.map((src) => (
                          <Link
                            key={src.id}
                            href={`/content/${src.slug}`}
                            className="flex items-center justify-between gap-2 px-3 py-2 hover:opacity-80 transition-opacity"
                            style={{
                              background: "var(--canvas)",
                              borderRadius: "8px",
                              border: "1px solid var(--hairline)",
                              color: "var(--primary)",
                              fontSize: "12px",
                            }}
                          >
                            <span className="truncate">{src.title}</span>
                            <ChevronRight className="w-3 h-3 shrink-0" aria-hidden="true" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isUser && msg.id && (
                    <div className="flex items-center gap-1 mt-1.5 ml-2">
                      {(['like', 'dislike'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => sendFeedback(index, msg.id!, type)}
                          aria-label={type === 'like' ? '도움됐어요' : '도움 안 됐어요'}
                          aria-pressed={msg.feedback === type}
                          className="p-1 rounded transition-colors hover:bg-gray-100"
                          style={{ color: msg.feedback === type ? "var(--primary)" : "var(--ink-muted-48)" }}
                        >
                          {type === 'like'
                            ? <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                            : <ThumbsDown className="w-3.5 h-3.5" aria-hidden="true" />
                          }
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div
                aria-label="답변 생성 중"
                className="flex items-center gap-1.5 px-4 py-3 w-fit"
                style={{ background: "var(--canvas-parchment)", borderRadius: "18px 18px 18px 4px" }}
              >
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: "var(--primary)", animationDelay: `${delay}ms` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="p-3 flex items-center gap-2 flex-shrink-0"
            style={{ borderTop: "1px solid var(--hairline)" }}
          >
            <label htmlFor="chat-input" className="sr-only">질문 입력</label>
            <input
              id="chat-input"
              type="text"
              placeholder="질문을 입력하세요..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-grow h-10 px-4 focus:outline-none disabled:opacity-50"
              style={{
                background: "var(--canvas-parchment)",
                border: "1px solid var(--hairline)",
                borderRadius: "9999px",
                color: "var(--ink)",
                fontSize: "14px",
                letterSpacing: "-0.224px",
              }}
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              aria-label="질문 전송"
              className="w-10 h-10 flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 disabled:opacity-50"
              style={{ background: "var(--primary)", borderRadius: "9999px", color: "#ffffff" }}
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
