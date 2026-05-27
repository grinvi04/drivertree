import { Injectable, Logger } from '@nestjs/common';
import { RecallQueryDto } from './dto/recall-query.dto';
import { RecallResultDto, RecallItemDto } from './dto/recall-result.dto';
import { InspectionQueryDto } from './dto/inspection-query.dto';
import { InspectionResultDto } from './dto/inspection-result.dto';

@Injectable()
export class CarService {
  private readonly logger = new Logger(CarService.name);

  async getRecalls(query: RecallQueryDto): Promise<RecallResultDto> {
    const apiKey = process.env.MOLIT_API_KEY;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(query.limit) || 10));

    if (!apiKey) {
      this.logger.warn('MOLIT_API_KEY not set — returning empty recall list');
      return { items: [], total: 0, page, limit };
    }

    const params = new URLSearchParams({
      serviceKey: apiKey,
      pageNo: String(page),
      numOfRows: String(limit),
      type: 'json',
    });
    if (query.model) params.set('vhclNm', query.model);
    if (query.maker) params.set('mnfctrNm', query.maker);

    const url = `https://apis.data.go.kr/1613000/VhclRcllInfoInqireService/getVhclRcllInfoDetail?${params.toString()}`;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) {
        this.logger.error(`Recall API HTTP ${res.status}`);
        return { items: [], total: 0, page, limit };
      }
      const json = (await res.json()) as {
        response?: {
          body?: {
            totalCount?: number;
            items?: { item?: unknown[] | unknown };
          };
        };
      };
      const body = json?.response?.body;
      const rawItems = body?.items?.item;
      const itemArray: unknown[] = Array.isArray(rawItems)
        ? rawItems
        : rawItems
          ? [rawItems]
          : [];

      const items: RecallItemDto[] = itemArray.map((raw) => {
        const r = raw as Record<string, string>;
        return {
          model: r['vhclNm'] ?? '',
          maker: r['mnfctrNm'] ?? '',
          recallDate: r['rcllBgngDe'] ?? '',
          defect: r['dfctCn'] ?? '',
          remedy: r['atchFileCn'] ?? '',
          contact: r['rcllMtrCn'] ?? undefined,
        };
      });

      return {
        items,
        total: Number(body?.totalCount ?? 0),
        page,
        limit,
      };
    } catch (err) {
      this.logger.error('Recall API fetch failed', err);
      return { items: [], total: 0, page, limit };
    }
  }

  async getInspection(query: InspectionQueryDto): Promise<InspectionResultDto> {
    const apiKey = process.env.TS_API_KEY;

    if (!apiKey) {
      this.logger.warn('TS_API_KEY not set — returning placeholder');
      return {
        plate: query.plate,
        isExpired: false,
        message:
          'API 키가 설정되지 않아 실시간 조회가 불가합니다. data.go.kr에서 교통안전공단 검사정보 API 키를 발급받아 TS_API_KEY 환경변수에 설정하세요.',
      };
    }

    const params = new URLSearchParams({
      serviceKey: apiKey,
      vhclNo: query.plate,
      pageNo: '1',
      numOfRows: '1',
      type: 'json',
    });

    const url = `https://apis.data.go.kr/1613000/VhclInspcInfoInqireService/getVhclInspcInfo?${params.toString()}`;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) {
        this.logger.error(`Inspection API HTTP ${res.status}`);
        return { plate: query.plate, isExpired: false };
      }
      const json = (await res.json()) as {
        response?: {
          body?: {
            items?: { item?: unknown[] | unknown };
          };
        };
      };
      const rawItem = json?.response?.body?.items?.item;
      const item = (Array.isArray(rawItem) ? rawItem[0] : rawItem) as
        | Record<string, string>
        | undefined;

      if (!item) {
        return { plate: query.plate, isExpired: false };
      }

      const expiryDateStr: string = item['inspcValdEndde'] ?? '';
      const expiryDate = expiryDateStr
        ? `${expiryDateStr.slice(0, 4)}-${expiryDateStr.slice(4, 6)}-${expiryDateStr.slice(6, 8)}`
        : undefined;

      const daysUntilExpiry = expiryDate
        ? Math.floor(
            (new Date(expiryDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          )
        : undefined;

      return {
        plate: query.plate,
        expiryDate,
        inspectionType: item['inspcSeNm'] ?? undefined,
        isExpired: daysUntilExpiry !== undefined ? daysUntilExpiry < 0 : false,
        daysUntilExpiry,
      };
    } catch (err) {
      this.logger.error('Inspection API fetch failed', err);
      return { plate: query.plate, isExpired: false };
    }
  }
}
