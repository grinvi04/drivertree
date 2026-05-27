import { Injectable, Logger } from '@nestjs/common';
import { LawSearchQueryDto } from './dto/law-search-query.dto';
import { LawSearchResultDto, LawItemDto } from './dto/law-search-result.dto';

const LAW_SEARCH_URL = 'https://www.law.go.kr/DRF/lawSearch.do';

@Injectable()
export class LawService {
  private readonly logger = new Logger(LawService.name);

  async search(query: LawSearchQueryDto): Promise<LawSearchResultDto> {
    const apiKey = process.env.LAW_API_KEY;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(query.limit) || 10));

    if (!apiKey) {
      this.logger.warn('LAW_API_KEY not set — returning empty result');
      return {
        items: [],
        total: 0,
        page,
        limit,
        message:
          'API 키가 설정되지 않아 법령 검색이 불가합니다. law.go.kr에서 OC 키를 발급받아 LAW_API_KEY 환경변수에 설정하세요.',
      };
    }

    const params = new URLSearchParams({
      OC: apiKey,
      target: 'law',
      query: query.query,
      type: 'JSON',
      display: String(limit),
      page: String(page),
    });

    try {
      const res = await fetch(`${LAW_SEARCH_URL}?${params.toString()}`, {
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        this.logger.error(`Law API HTTP ${res.status}`);
        return { items: [], total: 0, page, limit };
      }

      const json = (await res.json()) as {
        LawSearch?: {
          totalCnt?: string;
          law?: unknown[] | unknown;
        };
      };

      const lawSearch = json?.LawSearch;
      if (!lawSearch) {
        return { items: [], total: 0, page, limit };
      }

      const rawItems = lawSearch.law;
      const itemArray: unknown[] = Array.isArray(rawItems)
        ? rawItems
        : rawItems
          ? [rawItems]
          : [];

      const items: LawItemDto[] = itemArray.map((raw) => {
        const r = raw as Record<string, string>;
        const name = r['법령명한글'] ?? '';
        return {
          id: r['법령ID'] ?? '',
          name,
          type: r['법령구분명'] ?? undefined,
          ministry: r['소관부처명'] ?? undefined,
          effectiveDate: r['시행일자'] ?? undefined,
          url: `https://www.law.go.kr/법령/${name}`,
        };
      });

      return {
        items,
        total: Number(lawSearch.totalCnt ?? 0),
        page,
        limit,
      };
    } catch (err) {
      this.logger.error('Law API fetch failed', err);
      return { items: [], total: 0, page, limit };
    }
  }
}
