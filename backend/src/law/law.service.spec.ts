import { Test, TestingModule } from '@nestjs/testing';
import { LawService } from './law.service';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('LawService', () => {
  let service: LawService;
  const OLD_ENV = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    mockFetch.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [LawService],
    }).compile();

    service = module.get<LawService>(LawService);
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('search', () => {
    it('API 키 미설정 시 안내 메시지 반환', async () => {
      delete process.env.LAW_API_KEY;
      const result = await service.search({ query: '비보호좌회전' });
      expect(result.items).toHaveLength(0);
      expect(result.message).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('API 응답 정상 시 법령 목록 반환', async () => {
      process.env.LAW_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({
          LawSearch: {
            totalCnt: '2',
            law: [
              {
                법령ID: '100674',
                법령명한글: '도로교통법',
                법령구분명: '법률',
                소관부처명: '경찰청',
                시행일자: '20240101',
              },
              {
                법령ID: '100675',
                법령명한글: '도로교통법 시행령',
                법령구분명: '대통령령',
                소관부처명: '경찰청',
                시행일자: '20240101',
              },
            ],
          },
        }),
      });

      const result = await service.search({ query: '도로교통법' });
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('100674');
      expect(result.items[0].name).toBe('도로교통법');
      expect(result.items[0].type).toBe('법률');
      expect(result.items[0].url).toContain('도로교통법');
      expect(result.total).toBe(2);
    });

    it('단일 법령 응답 (배열 아님) 처리', async () => {
      process.env.LAW_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({
          LawSearch: {
            totalCnt: '1',
            law: {
              법령ID: '100674',
              법령명한글: '도로교통법',
              법령구분명: '법률',
              소관부처명: '경찰청',
              시행일자: '20240101',
            },
          },
        }),
      });

      const result = await service.search({ query: '도로교통법' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('도로교통법');
    });

    it('검색 결과 없을 시 빈 목록 반환', async () => {
      process.env.LAW_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({
          LawSearch: { totalCnt: '0' },
        }),
      });

      const result = await service.search({ query: '존재하지않는법령' });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('API HTTP 오류 시 빈 목록 반환', async () => {
      process.env.LAW_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await service.search({ query: '도로교통법' });
      expect(result.items).toHaveLength(0);
    });

    it('API 네트워크 오류 시 빈 목록 반환', async () => {
      process.env.LAW_API_KEY = 'test-key';
      mockFetch.mockRejectedValueOnce(new Error('network error'));

      const result = await service.search({ query: '도로교통법' });
      expect(result.items).toHaveLength(0);
    });

    it('page/limit 기본값 적용', async () => {
      process.env.LAW_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({ LawSearch: { totalCnt: '0' } }),
      });

      const result = await service.search({ query: '도로교통법' });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('limit 최대값 20 초과 시 20으로 제한', async () => {
      process.env.LAW_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({ LawSearch: { totalCnt: '0' } }),
      });

      const result = await service.search({ query: '도로교통법', limit: 99 });
      expect(result.limit).toBe(20);
    });

    it('법령 URL이 올바른 형식으로 생성됨', async () => {
      process.env.LAW_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => ({
          LawSearch: {
            totalCnt: '1',
            law: { 법령ID: '1', 법령명한글: '도로교통법' },
          },
        }),
      });

      const result = await service.search({ query: '도로교통법' });
      expect(result.items[0].url).toBe('https://www.law.go.kr/법령/도로교통법');
    });
  });
});
