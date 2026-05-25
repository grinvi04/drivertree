'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  FileText, 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  LogOut, 
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  BookOpen
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

interface ChatLog {
  id: string;
  sessionKey: string;
  userMessage: string;
  botResponse: string;
  matchedSources: { id: string; title: string; slug: string }[] | null;
  feedback: 'like' | 'dislike' | 'none';
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'content' | 'chatlogs'>('content');
  const [adminUser, setAdminUser] = useState('');

  // 가이드 콘텐츠 상태
  const [contents, setContents] = useState<GuideContent[]>([]);
  const [contentsLoading, setContentsLoading] = useState(true);

  // 챗 로그 상태
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // 콘텐츠 추가/수정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('license');
  const [tagsStr, setTagsStr] = useState('');
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // 인증 가드 + 초기 데이터 로딩 (마운트 1회만)
  useEffect(() => {
    const token = localStorage.getItem('drivetree_token');
    const user = localStorage.getItem('drivetree_user');
    if (!token || !user) {
      router.push('/admin/login');
      return;
    }
    setAdminUser(user);
    fetchContents();
    fetchChatLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchContents = async () => {
    setContentsLoading(true);
    try {
      const data = (await api.getContents()) as GuideContent[];
      setContents(data);
    } catch (err) {
      console.error('가이드 리스트 조회 실패:', err);
    } finally {
      setContentsLoading(false);
    }
  };

  const fetchChatLogs = async () => {
    setLogsLoading(true);
    try {
      const data = (await api.getChatLogs()) as ChatLog[];
      setChatLogs(data);
    } catch (err) {
      console.error('챗봇 모니터링 로그 조회 실패:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem('drivetree_token');
    localStorage.removeItem('drivetree_user');
    router.push('/admin/login');
  };

  // 모달 오픈 (등록용)
  const handleOpenAddModal = () => {
    setEditingPostId(null);
    setTitle('');
    setSlug('');
    setContent('');
    setCategory('license');
    setTagsStr('');
    setFormError('');
    setIsModalOpen(true);
  };

  // 모달 오픈 (수정용)
  const handleOpenEditModal = (post: GuideContent) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setContent(post.content);
    setCategory(post.category);
    setTagsStr(post.tags.join(', '));
    setFormError('');
    setIsModalOpen(true);
  };

  // 콘텐츠 저장 처리 (C & U)
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !content) {
      setFormError('모든 필드를 채워주세요.');
      return;
    }

    setFormSaving(true);
    setFormError('');

    const parsedTags = tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const postData = {
      title,
      slug,
      content,
      category,
      tags: parsedTags,
    };

    try {
      if (editingPostId) {
        // Update
        await api.updateContent(editingPostId, postData);
      } else {
        // Create
        await api.createContent(postData);
      }
      setIsModalOpen(false);
      fetchContents();
    } catch (err) {
      const message = err instanceof Error ? err.message : '가이드 저장 중 에러가 발생했습니다.';
      setFormError(message);
    } finally {
      setFormSaving(false);
    }
  };

  // 콘텐츠 삭제 처리 (D)
  const handleDeleteContent = async (id: string) => {
    if (!confirm('정말로 이 가이드 콘텐츠를 영구 삭제하시겠습니까?\nRAG 임베딩 정보도 자동으로 함께 제거됩니다.')) return;
    try {
      await api.deleteContent(id);
      fetchContents();
    } catch (err) {
      console.error('콘텐츠 삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="relative w-full flex flex-col min-h-screen bg-[#0B0F19] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-white/[0.05]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌳⚙️</span>
              <h1 className="text-2xl font-black text-white">DriveTree 백오피스 대시보드</h1>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
              접속 관리자: <span className="text-yellow-accent">{adminUser}</span>
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-xs font-bold text-red-400 cursor-pointer transition-colors w-fit"
          >
            <LogOut className="w-4 h-4" />
            안전 로그아웃
          </button>
        </div>

        {/* Tab Control */}
        <div className="flex gap-4 border-b border-white/[0.04] mb-8">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-1.5 pb-4 px-1 text-sm font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === 'content'
                ? 'border-yellow-accent text-yellow-accent'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileText className="w-[18px] h-[18px]" />
            가이드 콘텐츠 관리
          </button>
          <button
            onClick={() => setActiveTab('chatlogs')}
            className={`flex items-center gap-1.5 pb-4 px-1 text-sm font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === 'chatlogs'
                ? 'border-yellow-accent text-yellow-accent'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-[18px] h-[18px]" />
            AI 챗봇 모니터링 로그
          </button>
        </div>

        {/* 1. 콘텐츠 관리 테이블 */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-yellow-accent" />
                등록된 가이드 포스트 ({contents.length}개)
              </h3>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-[18px] py-2.5 rounded-xl btn-yellow-glow text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                새 실전 가이드 작성
              </button>
            </div>

            {contentsLoading ? (
              <div className="text-center py-20 text-xs text-slate-500">데이터 로딩 중...</div>
            ) : contents.length === 0 ? (
              <div className="text-center py-20 rounded-3xl glass-panel border border-white/5 flex flex-col items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-slate-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-400">등록된 가이드가 없습니다</h4>
                <p className="text-[10px] text-slate-500 mt-1">새 실전 가이드 작성 버튼을 눌러 초보자를 위한 팁을 작성하세요!</p>
              </div>
            ) : (
              <div className="rounded-3xl glass-panel border border-white/[0.06] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#121825] border-b border-white/[0.06] text-slate-400 font-bold">
                        <th className="p-4">가이드 제목</th>
                        <th className="p-4">URL 슬러그</th>
                        <th className="p-4">카테고리</th>
                        <th className="p-4">작성일</th>
                        <th className="p-4 text-center">액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {contents.map((post) => (
                        <tr key={post.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-bold text-slate-200 truncate max-w-[250px]">{post.title}</td>
                          <td className="p-4 text-slate-400 font-mono text-[11px]">{post.slug}</td>
                          <td className="p-4">
                            <span className="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                              {post.category}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleOpenEditModal(post)}
                              className="p-2 rounded-lg bg-white/[0.03] hover:bg-yellow-accent/15 border border-white/5 hover:border-yellow-accent/20 text-slate-400 hover:text-yellow-accent transition-all cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteContent(post.id)}
                              className="p-2 rounded-lg bg-white/[0.03] hover:bg-red-500/15 border border-white/5 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. 챗 로그 모니터링 테이블 */}
        {activeTab === 'chatlogs' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-accent" />
              챗봇 사용 및 평가지표 모니터링 로그 ({chatLogs.length}건)
            </h3>

            {logsLoading ? (
              <div className="text-center py-20 text-xs text-slate-500">대화 로그 로딩 중...</div>
            ) : chatLogs.length === 0 ? (
              <div className="text-center py-20 rounded-3xl glass-panel border border-white/5 flex flex-col items-center justify-center">
                <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-400">대화 이력이 아직 없습니다</h4>
                <p className="text-[10px] text-slate-500 mt-1">사용자가 챗봇을 호출하면 대화 로그와 RAG 만족도가 실시간 적재됩니다.</p>
              </div>
            ) : (
              <div className="rounded-3xl glass-panel border border-white/[0.06] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#121825] border-b border-white/[0.06] text-slate-400 font-bold">
                        <th className="p-4">시간</th>
                        <th className="p-4">사용자 질문</th>
                        <th className="p-4">AI 챗봇 답변</th>
                        <th className="p-4">매칭된 RAG 출처</th>
                        <th className="p-4 text-center">만족도 피드백</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {chatLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.01] transition-colors align-top">
                          <td className="p-4 text-slate-500 whitespace-nowrap text-[10px] font-semibold">
                            {new Date(log.createdAt).toLocaleTimeString()} <br />
                            <span className="text-[9px] text-slate-600">{new Date(log.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="p-4 text-slate-200 font-semibold max-w-[200px] break-words">{log.userMessage}</td>
                          <td className="p-4 text-slate-400 max-w-[300px] break-words leading-relaxed text-[11px]">{log.botResponse}</td>
                          <td className="p-4 max-w-[150px]">
                            {log.matchedSources && log.matchedSources.length > 0 ? (
                              <div className="flex flex-col gap-1.5">
                                {log.matchedSources.map((src) => (
                                  <span key={src.id} className="bg-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded truncate font-bold flex items-center gap-0.5">
                                    <ChevronRight className="w-2.5 h-2.5 text-yellow-accent shrink-0" />
                                    {src.title}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-semibold">출처 매칭 없음</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {log.feedback === 'like' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400">
                                <ThumbsUp className="w-3 h-3" />
                                만족
                              </span>
                            )}
                            {log.feedback === 'dislike' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-400">
                                <ThumbsDown className="w-3 h-3" />
                                불만족
                              </span>
                            )}
                            {log.feedback === 'none' && (
                              <span className="text-slate-600 text-[10px] font-bold">피드백 없음</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. 콘텐츠 생성/수정용 폼 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-3xl glass-panel border border-white/[0.08] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="px-6 py-[18px] bg-[#121825] border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  {editingPostId ? '🔧 실전 가이드 노하우 수정' : '🌳 새 실전 가이드 등록'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <form onSubmit={handleSaveContent} className="flex-grow p-6 overflow-y-auto space-y-4 flex flex-col">
                
                {/* 제목 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold">가이드 제목</label>
                  <input
                    type="text"
                    placeholder="예: 비보호 우회전할 때, 보행자 신호가 걸린다면 어떻게 하나요?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-yellow-accent text-xs font-semibold text-slate-200 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 슬러그 */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold">URL 슬러그 (Slug)</label>
                    <input
                      type="text"
                      placeholder="예: rules-unprotected-right-turn"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-yellow-accent text-xs font-semibold text-slate-200 focus:outline-none font-mono"
                      required
                    />
                  </div>

                  {/* 카테고리 */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold">카테고리</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-yellow-accent text-xs font-semibold text-slate-200 focus:outline-none"
                    >
                      <option value="license" className="bg-[#121825]">면허 취득 가이드</option>
                      <option value="basics" className="bg-[#121825]">운전 기본기</option>
                      <option value="rules" className="bg-[#121825]">도로 법규 · 신호</option>
                      <option value="management" className="bg-[#121825]">차량 관리 · 생활</option>
                      <option value="accidents" className="bg-[#121825]">사고 · 이슈 대처</option>
                    </select>
                  </div>
                </div>

                {/* 태그 (쉼표 구분) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold">검색 태그 (쉼표로 구분)</label>
                  <input
                    type="text"
                    placeholder="예: 우회전, 신호위반, 교차로"
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-yellow-accent text-xs font-semibold text-slate-200 focus:outline-none"
                  />
                </div>

                {/* 마크다운 본문 에디터 */}
                <div className="flex flex-col gap-1.5 flex-grow min-h-[200px]">
                  <label className="text-xs text-slate-400 font-bold">가이드 본문 내용 (Markdown 문법 지원)</label>
                  <textarea
                    placeholder="마크다운을 지원합니다.
## 1. 보행자가 횡단보도를 건너는 중일 때
반드시 **일시정지**하고 보행자가 다 건널 때까지 대기하세요!

## 2. 보행자가 횡단보도를 다 건넌 후
서행으로 천천히 우회전을 통과하면 됩니다."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full flex-grow p-[18px] rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-yellow-accent text-xs font-medium text-slate-200 focus:outline-none resize-none font-mono min-h-[180px]"
                    required
                  />
                </div>

                {/* 에러 */}
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 rounded-xl leading-relaxed">
                    ⚠️ {formError}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3.5 pt-3 border-t border-white/[0.04] mt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="px-5 py-2.5 rounded-xl btn-yellow-glow text-xs font-bold"
                  >
                    {formSaving ? '임베딩 갱신 중...' : '가이드 발행 완료'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
