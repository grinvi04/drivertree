import { Test, TestingModule } from '@nestjs/testing';
import { CarService } from './car.service';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('CarService', () => {
  let service: CarService;
  const OLD_ENV = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    mockFetch.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CarService],
    }).compile();

    service = module.get<CarService>(CarService);
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('getRecalls', () => {
    it('API 키 미설정 시 빈 목록 반환', async () => {
      delete process.env.MOLIT_API_KEY;
      const result = await service.getRecalls({ model: '아반떼' });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('API 응답 정상 시 리콜 목록 반환', async () => {
      process.env.MOLIT_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            body: {
              totalCount: 1,
              items: {
                item: [
                  {
                    vhclNm: '아반떼 CN7',
                    mnfctrNm: '현대',
                    rcllBgngDe: '20210315',
                    dfctCn: '연료펌프 결함',
                    atchFileCn: '연료펌프 교체',
                    rcllMtrCn: '1588-0100',
                  },
                ],
              },
            },
          },
        }),
      });

      const result = await service.getRecalls({
        model: '아반떼',
        page: 1,
        limit: 10,
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].model).toBe('아반떼 CN7');
      expect(result.items[0].maker).toBe('현대');
      expect(result.total).toBe(1);
    });

    it('API HTTP 오류 시 빈 목록 반환', async () => {
      process.env.MOLIT_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await service.getRecalls({ model: '아반떼' });
      expect(result.items).toHaveLength(0);
    });

    it('API 네트워크 오류 시 빈 목록 반환', async () => {
      process.env.MOLIT_API_KEY = 'test-key';
      mockFetch.mockRejectedValueOnce(new Error('network error'));

      const result = await service.getRecalls({ model: '아반떼' });
      expect(result.items).toHaveLength(0);
    });

    it('단일 item (배열 아님) 응답 처리', async () => {
      process.env.MOLIT_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            body: {
              totalCount: 1,
              items: {
                item: {
                  vhclNm: '소나타',
                  mnfctrNm: '현대',
                  rcllBgngDe: '20220101',
                  dfctCn: '브레이크 결함',
                  atchFileCn: '브레이크 패드 교체',
                },
              },
            },
          },
        }),
      });

      const result = await service.getRecalls({ model: '소나타' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].model).toBe('소나타');
    });

    it('page/limit 기본값 적용', async () => {
      process.env.MOLIT_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: { body: { totalCount: 0, items: {} } },
        }),
      });

      const result = await service.getRecalls({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('limit 최대값 20 초과 시 20으로 제한', async () => {
      process.env.MOLIT_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: { body: { totalCount: 0, items: {} } },
        }),
      });

      const result = await service.getRecalls({ limit: 100 });
      expect(result.limit).toBe(20);
    });
  });

  describe('getInspection', () => {
    it('API 키 미설정 시 안내 메시지 반환', async () => {
      delete process.env.TS_API_KEY;
      const result = await service.getInspection({ plate: '123가4567' });
      expect(result.plate).toBe('123가4567');
      expect(result.message).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('API 응답 정상 시 검사 유효기간 반환', async () => {
      process.env.TS_API_KEY = 'test-key';
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 45);
      const y = futureDate.getFullYear();
      const m = String(futureDate.getMonth() + 1).padStart(2, '0');
      const d = String(futureDate.getDate()).padStart(2, '0');
      const inspcValdEndde = `${y}${m}${d}`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            body: {
              items: {
                item: [{ inspcValdEndde, inspcSeNm: '정기검사' }],
              },
            },
          },
        }),
      });

      const result = await service.getInspection({ plate: '123가4567' });
      expect(result.plate).toBe('123가4567');
      expect(result.isExpired).toBe(false);
      expect(result.daysUntilExpiry).toBeGreaterThan(0);
      expect(result.inspectionType).toBe('정기검사');
    });

    it('만료된 검사 기한 감지', async () => {
      process.env.TS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            body: {
              items: {
                item: [{ inspcValdEndde: '20200101', inspcSeNm: '정기검사' }],
              },
            },
          },
        }),
      });

      const result = await service.getInspection({ plate: '123가4567' });
      expect(result.isExpired).toBe(true);
      expect(result.daysUntilExpiry).toBeLessThan(0);
    });

    it('API 응답에 item 없을 시 기본값 반환', async () => {
      process.env.TS_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: { body: { items: {} } },
        }),
      });

      const result = await service.getInspection({ plate: '123가4567' });
      expect(result.plate).toBe('123가4567');
      expect(result.isExpired).toBe(false);
    });

    it('API 네트워크 오류 시 기본값 반환', async () => {
      process.env.TS_API_KEY = 'test-key';
      mockFetch.mockRejectedValueOnce(new Error('network error'));

      const result = await service.getInspection({ plate: '123가4567' });
      expect(result.plate).toBe('123가4567');
      expect(result.isExpired).toBe(false);
    });
  });
});
