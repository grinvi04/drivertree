import { Injectable, Logger } from '@nestjs/common';
import { HotspotQueryDto } from './dto/hotspot-query.dto';
import { HotspotResultDto, HotspotItemDto } from './dto/hotspot-result.dto';

const TAAS_URL =
  'https://opendata.koroad.or.kr/api/selectAcdntRiskAreaDataSet.do';

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  async getHotspots(query: HotspotQueryDto): Promise<HotspotResultDto> {
    const apiKey = process.env.TAAS_API_KEY;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));

    if (!apiKey) {
      this.logger.warn('TAAS_API_KEY not set — returning empty result');
      return {
        items: [],
        total: 0,
        page,
        limit,
        message:
          'API 키가 설정되지 않아 사고다발지점 조회가 불가합니다. taas.koroad.or.kr 오픈API에서 authKey를 발급받아 TAAS_API_KEY 환경변수에 설정하세요.',
      };
    }

    const params = new URLSearchParams({
      authKey: apiKey,
      siDo: query.siDo,
      pageNo: String(page),
      numOfRows: String(limit),
      type: 'json',
    });
    if (query.guGun) params.set('guGun', query.guGun);

    try {
      const res = await fetch(`${TAAS_URL}?${params.toString()}`, {
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        this.logger.error(`TAAS API HTTP ${res.status}`);
        return { items: [], total: 0, page, limit };
      }

      const json = (await res.json()) as {
        totalCnt?: string | number;
        list?: unknown;
      };

      const rawItems = json?.list;
      const itemArray: unknown[] = Array.isArray(rawItems)
        ? rawItems
        : rawItems
          ? [rawItems]
          : [];

      const items: HotspotItemDto[] = itemArray.map((raw) => {
        const r = raw as Record<string, string>;
        return {
          spotNm: r['spotNm'] ?? r['도로명'] ?? '',
          siDo: r['siDo'] ?? query.siDo,
          guGun: r['guGun'] ?? '',
          dong: r['dong'] ?? undefined,
          spotType: r['spotType'] ?? undefined,
          accCnt: Number(r['accCnt'] ?? 0),
          dthCnt: Number(r['dthCnt'] ?? 0),
          injCnt: Number(r['injCnt'] ?? 0),
          startYear: r['startYear'] ?? undefined,
          endYear: r['endYear'] ?? undefined,
        };
      });

      return {
        items,
        total: Number(json?.totalCnt ?? 0),
        page,
        limit,
      };
    } catch (err) {
      this.logger.error('TAAS API fetch failed', err);
      return { items: [], total: 0, page, limit };
    }
  }
}
