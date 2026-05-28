import { Test, TestingModule } from '@nestjs/testing';
import { SafetyService } from './safety.service';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const SAMPLE_ITEM = {
  spotNm: '강남대로 교차로',
  siDo: '서울특별시',
  guGun: '강남구',
  dong: '논현동',
  spotType: '교차로',
  accCnt: '5',
  dthCnt: '0',
  injCnt: '8',
  startYear: '2020',
  endYear: '2023',
};

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
      const result = await service.getHotspots({ siDo: '서울특별시' });
      expect(result.items).toHaveLength(0);
      expect(result.message).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('정상 응답 시 다발지점 목록 반환', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({
          totalCnt: '2',
          list: [
            SAMPLE_ITEM,
            { ...SAMPLE_ITEM, spotNm: '테헤란로 교차로', guGun: '서초구' },
          ],
        }),
      });

      const result = await service.getHotspots({ siDo: '서울특별시' });
      expect(result.items).toHaveLength(2);
      expect(result.items[0].spotNm).toBe('강남대로 교차로');
      expect(result.items[0].accCnt).toBe(5);
      expect(result.total).toBe(2);
    });

    it('단일 아이템 (배열 아님) 처리', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({
          totalCnt: '1',
          list: SAMPLE_ITEM,
        }),
      });

      const result = await service.getHotspots({ siDo: '서울특별시' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].injCnt).toBe(8);
    });

    it('결과 없을 시 빈 목록 반환', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({ totalCnt: '0' }),
      });

      const result = await service.getHotspots({ siDo: '세종특별자치시' });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('API HTTP 오류 시 빈 목록 반환', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await service.getHotspots({ siDo: '서울특별시' });
      expect(result.items).toHaveLength(0);
    });

    it('API 네트워크 오류 시 빈 목록 반환', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockRejectedValueOnce(new Error('network error'));

      const result = await service.getHotspots({ siDo: '서울특별시' });
      expect(result.items).toHaveLength(0);
    });

    it('page/limit 기본값 적용', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({ totalCnt: '0' }),
      });

      const result = await service.getHotspots({ siDo: '경기도' });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('limit 최대값 50 초과 시 50으로 제한', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({ totalCnt: '0' }),
      });

      const result = await service.getHotspots({ siDo: '경기도', limit: 999 });
      expect(result.limit).toBe(50);
    });

    it('구군 파라미터 포함 시 URL에 추가', async () => {
      process.env.TAAS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({ totalCnt: '0' }),
      });

      await service.getHotspots({ siDo: '서울특별시', guGun: '강남구' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('guGun=%EA%B0%95%EB%82%A8%EA%B5%AC'),
        expect.anything(),
      );
    });
  });
});
