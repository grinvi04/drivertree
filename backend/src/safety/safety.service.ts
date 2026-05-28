import { Injectable, Logger } from '@nestjs/common';
import { HotspotQueryDto } from './dto/hotspot-query.dto';
import { HotspotResultDto, HotspotItemDto } from './dto/hotspot-result.dto';

const TAAS_URL = 'https://opendata.koroad.or.kr/data/rest/accident/riskArea';

// 서버 WAF 우회: 브라우저 식별 헤더 없이는 Request Blocked (400) 반환
const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; DriveTree/1.1; +https://drivetree.vercel.app)',
  Accept: 'application/json, text/plain, */*',
  Referer: 'https://opendata.koroad.or.kr/',
};

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  async getHotspots(query: HotspotQueryDto): Promise<HotspotResultDto> {
    const apiKey = process.env.TAAS_API_KEY;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const year = query.searchYearCd ?? '2023';

    if (!apiKey) {
      this.logger.warn('TAAS_API_KEY not set — returning empty result');
      return {
        items: [],
        total: 0,
        page,
        limit,
        message:
          'API 키가 설정되지 않아 사고위험구역 조회가 불가합니다. opendata.koroad.or.kr 오픈API에서 authKey를 발급받아 TAAS_API_KEY 환경변수에 설정하세요.',
      };
    }

    const params = new URLSearchParams({
      authKey: apiKey,
      siDo: query.siDo,
      guGun: query.guGun,
      searchYearCd: year,
      pageNo: String(page),
      numOfRows: String(limit),
      type: 'json',
    });

    try {
      const res = await fetch(`${TAAS_URL}?${params.toString()}`, {
        signal: AbortSignal.timeout(10_000),
        headers: FETCH_HEADERS,
      });

      if (!res.ok) {
        this.logger.error(`TAAS API HTTP ${res.status}`);
        return { items: [], total: 0, page, limit };
      }

      const json = (await res.json()) as {
        resultCode?: string;
        resultMsg?: string;
        items?: { item?: unknown };
        totalCount?: string | number;
      };

      if (json?.resultCode !== '00') {
        this.logger.warn(
          `TAAS API error ${json?.resultCode}: ${json?.resultMsg}`,
        );
        return { items: [], total: 0, page, limit };
      }

      const rawList = json?.items?.item;
      const itemArray: unknown[] = Array.isArray(rawList)
        ? rawList
        : rawList
          ? [rawList]
          : [];

      const items: HotspotItemDto[] = itemArray.map((raw) => {
        const r = raw as Record<string, unknown>;
        const causes = r['cause_anals_ty_nm'];
        return {
          id: (r['acc_risk_area_id'] as string | undefined) ?? '',
          name: (r['acc_risk_area_nm'] as string | undefined) ?? '',
          totalAccCnt: Number(r['tot_acc_cnt'] ?? 0),
          deathCnt: Number(r['tot_dth_dnv_cnt'] ?? 0),
          seriousInjuryCnt: Number(r['tot_se_dnv_cnt'] ?? 0),
          slightInjuryCnt: Number(r['tot_sl_dnv_cnt'] ?? 0),
          woundCnt: Number(r['tot_wnd_dnv_cnt'] ?? 0),
          centerX: Number(r['cntpnt_utmk_x_crd'] ?? 0),
          centerY: Number(r['cntpnt_utmk_y_crd'] ?? 0),
          causes: Array.isArray(causes) ? (causes as string[]) : [],
        };
      });

      return {
        items,
        total: Number(json?.totalCount ?? 0),
        page,
        limit,
      };
    } catch (err) {
      this.logger.error('TAAS API fetch failed', err);
      return { items: [], total: 0, page, limit };
    }
  }
}
