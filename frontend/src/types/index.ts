// 프로젝트 전체 공유 타입 — 이 파일 하나에서 관리

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}


export interface GuideContent {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchedSource {
  id: string;
  title: string;
  slug: string;
}

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'bot';
  text: string;
  sources?: MatchedSource[];
  feedback?: 'like' | 'dislike' | 'none';
}

export interface PenaltyRule {
  id: string;
  name: string;
  category: string;
  fineNormal: number;
  fineChildZone: number;
  penaltyNormal: number;
  penaltyChildZone: number;
  pointsNormal: number;
  pointsChildZone: number;
  description: string;
}

export interface MaintenanceInput {
  carType: 'compact' | 'sedan' | 'suv' | 'large';
  fuelType: 'gasoline' | 'diesel' | 'electric';
  annualMileage: number;
  insuranceCost: number;
}

export interface MaintenanceCosts {
  fuel: number;
  tax: number;
  insurance: number;
  maintenance: number;
  total: number;
}

export interface MaintenanceResult {
  annual: MaintenanceCosts;
  monthly: MaintenanceCosts;
  analysis: {
    fuelPercentage: number;
    taxPercentage: number;
    insurancePercentage: number;
    maintenancePercentage: number;
  };
}

export interface AdminContent {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatLog {
  id: string;
  sessionKey: string;
  userMessage: string;
  botResponse: string;
  matchedSources: MatchedSource[] | null;
  feedback: 'like' | 'dislike' | 'none';
  createdAt: string;
}

export interface LawItem {
  id: string;
  name: string;
  type?: string;
  ministry?: string;
  effectiveDate?: string;
  url: string;
}

export interface LawSearchResult {
  items: LawItem[];
  total: number;
  page: number;
  limit: number;
  message?: string;
}

export interface HotspotItem {
  id: string;
  name: string;
  totalAccCnt: number;
  deathCnt: number;
  seriousInjuryCnt: number;
  slightInjuryCnt: number;
  woundCnt: number;
  centerX: number;
  centerY: number;
  causes: string[];
}

export interface HotspotResult {
  items: HotspotItem[];
  total: number;
  page: number;
  limit: number;
  message?: string;
}

export interface ContentFormData {
  title: string;
  slug: string;
  category: string;
  tags: string;
  content: string;
}
