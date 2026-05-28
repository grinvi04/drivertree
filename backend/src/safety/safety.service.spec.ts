import { Test, TestingModule } from '@nestjs/testing';
import { SafetyService } from './safety.service';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const SAMPLE_ITEM = {
  acc_risk_area_id: '98473',
  acc_risk_area_nm:
    '서울특별시 강남구내에서 2023년도에 반경50m 이내 다른사고14건 이상 지역',
  tot_acc_cnt: 22,
  tot_dth_dnv_cnt: 0,
  tot_se_dnv_cnt: 2,
  tot_sl_dnv_cnt: 24,
  tot_wnd_dnv_cnt: 4,
  cntpnt_utmk_x_crd: 959928,
  cntpnt_utmk_y_crd: 1943994,
  cause_anals_ty_nm: ['기타', '신호위반', '안전거리미확보'],
};

const OK_RESPONSE = (items: unknown[], totalCount = items.length) => ({
  ok: true,
  json: () => ({
    resultCode: '00',
    resultMsg: 'NORMAL_CODE',
    items: { item: items },
    totalCount: String(totalCount),
  }),
});

describe('SafetyService', () => {
  let service: SafetyService;
  const OLD_ENV = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    mockFetch.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SafetyService],
    }).compile();

    service = module.get<SafetyService>(SafetyService);
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('getHotspots', () => {
    it('API 키 미설정 시 안내 메시지 반환', async () => {
      delete process.env.TAAS_API_KEY;
      const result = await service.getHotspots({ siDo: '11', guGun: '680' });
      expect(result.items).toHaveLength(0);
      expect(result.message).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('정상 응답 시 위험구역 목록 반환', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce(
        OK_RESPONSE(
          [
            SAMPLE_ITEM,
            { ...SAMPLE_ITEM, acc_risk_area_id: '98486', tot_acc_cnt: 41 },
          ],
          2,
        ),
      );

      const result = await service.getHotspots({ siDo: '11', guGun: '680' });
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('98473');
      expect(result.items[0].totalAccCnt).toBe(22);
      expect(result.items[0].deathCnt).toBe(0);
      expect(result.items[0].seriousInjuryCnt).toBe(2);
      expect(result.items[0].causes).toEqual([
        '기타',
        '신호위반',
        '안전거리미확보',
      ]);
      expect(result.total).toBe(2);
    });

    it('단일 아이템 (배열 아님) 처리', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({
          resultCode: '00',
          items: { item: SAMPLE_ITEM },
          totalCount: '1',
        }),
      });

      const result = await service.getHotspots({ siDo: '11', guGun: '680' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].slightInjuryCnt).toBe(24);
    });

    it('결과 없을 시 빈 목록 반환', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({
          resultCode: '00',
          items: { item: [] },
          totalCount: '0',
        }),
      });

      const result = await service.getHotspots({ siDo: '36', guGun: '110' });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('API resultCode 오류 시 빈 목록 반환', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({
          resultCode: '10',
          resultMsg: 'INVALID_REQUEST_PARAMETER_ERROR',
        }),
      });

      const result = await service.getHotspots({ siDo: '11', guGun: '680' });
      expect(result.items).toHaveLength(0);
    });

    it('API HTTP 오류 시 빈 목록 반환', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await service.getHotspots({ siDo: '11', guGun: '680' });
      expect(result.items).toHaveLength(0);
    });

    it('API 네트워크 오류 시 빈 목록 반환', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockRejectedValueOnce(new Error('network error'));

      const result = await service.getHotspots({ siDo: '11', guGun: '680' });
      expect(result.items).toHaveLength(0);
    });

    it('page/limit 기본값 적용', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce(OK_RESPONSE([]));

      const result = await service.getHotspots({ siDo: '41', guGun: '111' });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('limit 최대값 50 초과 시 50으로 제한', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce(OK_RESPONSE([]));

      const result = await service.getHotspots({
        siDo: '41',
        guGun: '111',
        limit: 999,
      });
      expect(result.limit).toBe(50);
    });

    it('searchYearCd 파라미터가 URL에 포함', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce(OK_RESPONSE([]));

      await service.getHotspots({
        siDo: '11',
        guGun: '680',
        searchYearCd: '2022',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('searchYearCd=2022'),
        expect.anything(),
      );
    });

    it('searchYearCd 미설정 시 기본값 2023 사용', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce(OK_RESPONSE([]));

      await service.getHotspots({ siDo: '11', guGun: '680' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('searchYearCd=2023'),
        expect.anything(),
      );
    });

    it('브라우저 User-Agent 헤더 포함', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce(OK_RESPONSE([]));

      await service.getHotspots({ siDo: '11', guGun: '680' });
      const [, options] = mockFetch.mock.calls[0] as [
        string,
        { headers: Record<string, string> },
      ];
      expect(options.headers['User-Agent']).toContain('DriveTree');
    });
  });
});
