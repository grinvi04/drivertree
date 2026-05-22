const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// 콘텐츠 생성/수정에 사용되는 페이로드 타입
export interface ContentPayload {
  title: string;
  slug: string;
  content: string;
  category: string;
  tags?: string[];
}

export type ContentUpdatePayload = Partial<ContentPayload>;

/**
 * JWT 토큰을 로컬스토리지에서 가져옵니다. (클라이언트 사이드)
 */
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('drivetree_token');
  }
  return null;
}

/**
 * 백엔드 API를 공통으로 호출하는 fetch 래퍼 함수
 */
async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = '요청 처리 중 오류가 발생했습니다.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 유지
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // 1. Auth API
  login: (username: string, password: string) =>
    apiRequest<{ accessToken: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getProfile: () => apiRequest('/auth/profile'),

  // 2. Content API
  getContents: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return apiRequest(`/content?${params.toString()}`);
  },
  getContentById: (id: string) => apiRequest(`/content/${id}`),
  getContentBySlug: (slug: string) => apiRequest(`/content/slug/${slug}`),
  createContent: (data: ContentPayload) =>
    apiRequest('/content', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateContent: (id: string, data: ContentUpdatePayload) =>
    apiRequest(`/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteContent: (id: string) =>
    apiRequest(`/content/${id}`, {
      method: 'DELETE',
    }),

  // 3. Chat API
  askChat: (message: string, sessionKey: string) =>
    apiRequest<{
      id: string;
      botResponse: string;
      matchedSources?: { id: string; title: string; slug: string }[];
    }>('/chat/ask', {
      method: 'POST',
      body: JSON.stringify({ message, sessionKey }),
    }),
  sendFeedback: (id: string, feedback: 'like' | 'dislike' | 'none') =>
    apiRequest(`/chat/feedback/${id}`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),
  getChatLogs: () => apiRequest('/chat/logs'),

  // 4. Calculator API
  getPenalties: () => apiRequest('/calculator/penalties'),
  calculateMaintenance: (data: {
    carType: string;
    fuelType: string;
    annualMileage: number;
    insuranceCost: number;
  }) =>
    apiRequest('/calculator/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
