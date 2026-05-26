import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ContentService } from './content.service';
import { PrismaService } from '../prisma.service';
import { GeminiService } from '../common/gemini.service';

type ChunkFn = (text: string, maxChars?: number) => string[];

function makeContentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'content-1',
    title: '비보호 좌회전 가이드',
    slug: 'unprotected-left',
    content: '비보호 좌회전은 신호등이 없을 때 가능합니다.',
    category: 'rules',
    tags: ['좌회전', '신호'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makePrismaStub() {
  return {
    content: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest
        .fn()
        .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ ...makeContentRow(), ...data }),
        ),
      update: jest
        .fn()
        .mockImplementation(
          ({
            data,
            where,
          }: {
            data: Record<string, unknown>;
            where: Record<string, unknown>;
          }) => Promise.resolve({ ...makeContentRow(), ...where, ...data }),
        ),
      delete: jest.fn().mockResolvedValue(makeContentRow()),
      count: jest.fn().mockResolvedValue(0),
    },
    contentEmbedding: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest
      .fn()
      .mockImplementation((ops: unknown[]) => Promise.all(ops)),
    $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
  } as unknown as PrismaService;
}

function makeGeminiStub() {
  return {
    getEmbedding: jest.fn().mockResolvedValue(null),
  } as unknown as GeminiService;
}

describe('ContentService', () => {
  let service: ContentService;
  let prisma: ReturnType<typeof makePrismaStub>;

  beforeEach(async () => {
    prisma = makePrismaStub();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: prisma },
        { provide: GeminiService, useValue: makeGeminiStub() },
      ],
    }).compile();
    service = module.get<ContentService>(ContentService);
  });

  // ────────────────────────────────────────
  // chunkText (private)
  // ────────────────────────────────────────
  describe('chunkText()', () => {
    function chunk(text: string, maxChars?: number): string[] {
      return (service as unknown as { chunkText: ChunkFn }).chunkText(
        text,
        maxChars,
      );
    }

    it('returns single chunk for short text', () => {
      const chunks = chunk('짧은 텍스트입니다.', 200);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('짧은 텍스트입니다.');
    });

    it('splits long text into multiple chunks not exceeding ~maxChars', () => {
      const longText = ('a'.repeat(50) + '. ').repeat(20); // 1040 chars
      const chunks = chunk(longText, 200);
      expect(chunks.length).toBeGreaterThan(1);
      for (const c of chunks) {
        expect(c.length).toBeLessThanOrEqual(260);
      }
    });

    it('preserves original content across all chunks (no data loss)', () => {
      const text =
        '첫 문장입니다. 두 번째 문장입니다.\n세 번째 줄입니다. 네 번째 문장입니다.';
      const chunks = chunk(text, 30);
      const joined = chunks.join('');
      expect(joined).toContain('첫 문장');
      expect(joined).toContain('세 번째');
    });

    it('returns empty array for empty string', () => {
      expect(chunk('')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────
  // create()
  // ────────────────────────────────────────
  describe('create()', () => {
    it('returns response DTO without embeddings relation', async () => {
      const result = await service.create({
        title: '가이드',
        slug: 'guide-1',
        content: '내용',
        category: 'rules',
        tags: ['태그'],
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('slug');
      expect(result).not.toHaveProperty('embeddings');
    });

    it('throws ConflictException when slug already exists', async () => {
      (prisma.content.findUnique as jest.Mock).mockResolvedValueOnce(
        makeContentRow(),
      );
      await expect(
        service.create({
          title: 't',
          slug: 'dupe',
          content: 'c',
          category: 'rules',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  // ────────────────────────────────────────
  // findOne()
  // ────────────────────────────────────────
  describe('findOne()', () => {
    it('returns content when found', async () => {
      (prisma.content.findUnique as jest.Mock).mockResolvedValueOnce(
        makeContentRow(),
      );
      const result = await service.findOne('content-1');
      expect(result.id).toBe('content-1');
    });

    it('throws NotFoundException when not found', async () => {
      (prisma.content.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.findOne('nonexistent')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // ────────────────────────────────────────
  // remove()
  // ────────────────────────────────────────
  describe('remove()', () => {
    it('returns { id } of deleted item', async () => {
      (prisma.content.findUnique as jest.Mock).mockResolvedValueOnce(
        makeContentRow(),
      );
      const result = await service.remove('content-1');
      expect(result).toEqual({ id: 'content-1' });
    });

    it('throws NotFoundException for nonexistent id', async () => {
      (prisma.content.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.remove('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // ────────────────────────────────────────
  // findAll() pagination meta
  // ────────────────────────────────────────
  describe('findAll() — pagination meta', () => {
    it('returns correct totalPages in meta', async () => {
      const rows = Array.from({ length: 5 }, (_, i) =>
        makeContentRow({ id: `c-${i}`, slug: `s-${i}` }),
      );
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce([rows, 25]);
      const result = await service.findAll({
        page: 1,
        limit: 5,
        category: undefined,
        search: undefined,
      });
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.total).toBe(25);
      expect(result.data).toHaveLength(5);
    });

    it('returns totalPages=1 when total <= limit', async () => {
      const rows = [makeContentRow()];
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce([rows, 1]);
      const result = await service.findAll({
        page: 1,
        limit: 10,
        category: undefined,
        search: undefined,
      });
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
