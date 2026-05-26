import { ApiError } from '@/lib/errors';
import type {
  GuideContent,
  ChatMessage,
  MatchedSource,
  PenaltyRule,
  MaintenanceInput,
  MaintenanceResult,
  AdminContent,
  ChatLog,
  PaginatedResult,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ContentPayload {
  title: string;
  slug: string;
  content: string;
  category: string;
  tags?: string[];
}

export type ContentUpdatePayload = Partial<ContentPayload>;

interface LoginResponse {
  accessToken: string;
  username: string;
}

interface AskChatResponse {
  id: string;
  botResponse: string;
  matchedSources?: MatchedSource[];
}

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('drivetree_token');
  }
  return null;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers ?? {});

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    let message = '요청 처리 중 오류가 발생했습니다.';
    try {
      const errorData = (await response.json()) as { message?: string };
      message = errorData.message ?? message;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 유지
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (username: string, password: string): Promise<LoginResponse> =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getProfile: (): Promise<unknown> => apiRequest<unknown>('/auth/profile'),

  // Content — 페이지네이션 응답
  getContents: (
    category?: string,
    search?: string,
    page = 1,
    limit = 12,
  ): Promise<PaginatedResult<GuideContent>> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    params.append('page', String(page));
    params.append('limit', String(limit));
    return apiRequest<PaginatedResult<GuideContent>>(`/content?${params.toString()}`);
  },

  getContentBySlug: (slug: string): Promise<GuideContent> =>
    apiRequest<GuideContent>(`/content/slug/${slug}`),

  getContentById: (id: string): Promise<GuideContent> =>
    apiRequest<GuideContent>(`/content/${id}`),

  createContent: (data: ContentPayload): Promise<GuideContent> =>
    apiRequest<GuideContent>('/content', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateContent: (id: string, data: ContentUpdatePayload): Promise<GuideContent> =>
    apiRequest<GuideContent>(`/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteContent: (id: string): Promise<{ id: string }> =>
    apiRequest<{ id: string }>(`/content/${id}`, { method: 'DELETE' }),

  // Chat
  askChat: (message: string, sessionKey: string): Promise<AskChatResponse> =>
    apiRequest<AskChatResponse>('/chat/ask', {
      method: 'POST',
      body: JSON.stringify({ message, sessionKey }),
    }),

  sendFeedback: (id: string, feedback: ChatMessage['feedback']): Promise<unknown> =>
    apiRequest<unknown>(`/chat/feedback/${id}`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),

  getChatLogs: (page = 1, limit = 20): Promise<PaginatedResult<ChatLog>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiRequest<PaginatedResult<ChatLog>>(`/chat/logs?${params.toString()}`);
  },

  // Calculator
  getPenalties: (): Promise<PenaltyRule[]> =>
    apiRequest<PenaltyRule[]>('/calculator/penalties'),

  calculateMaintenance: (data: MaintenanceInput): Promise<MaintenanceResult> =>
    apiRequest<MaintenanceResult>('/calculator/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// 타입 re-export (하위 호환)
export type { AdminContent };
