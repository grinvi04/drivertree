import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  CreateContentDto,
  UpdateContentDto,
  ContentQueryDto,
} from './content.dto';
import { rankContents } from '../common/local-nlp.helper';
import { GeminiService } from '../common/gemini.service';
import { RAG_CONFIG } from '../common/constants/rag.config';
import { paginate, PaginatedResult } from '../common/dto/pagination.dto';
import { SEED_CONTENTS } from '../../prisma/seeds/content.data';

@Injectable()
export class ContentService implements OnModuleInit {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  async onModuleInit() {
    let inserted = 0;
    for (const post of SEED_CONTENTS) {
      const existing = await this.prisma.content.findUnique({
        where: { slug: post.slug },
      });
      if (!existing) {
        await this.create(post);
        inserted++;
      }
    }
    if (inserted > 0) {
      this.logger.log(`[Seed] Inserted ${inserted} new seed content(s).`);
    } else {
      this.logger.log('[Seed] All seed contents already present.');
    }
  }

  private chunkText(
    text: string,
    maxChars = RAG_CONFIG.MAX_CHUNK_SIZE,
  ): string[] {
    const sentences = text.split(/(\n+?|\.\s+)/);
    const chunks: string[] = [];
    let current = '';
    for (const part of sentences) {
      if (current.length + part.length > maxChars) {
        if (current.trim()) chunks.push(current.trim());
        current = part;
      } else {
        current += part;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  async create(dto: CreateContentDto) {
    const existing = await this.prisma.content.findUnique({
      where: { slug: dto.slug },
    });
    if (existing)
      throw new ConflictException('이미 존재하는 슬러그(Slug)입니다.');

    const content = await this.prisma.content.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        category: dto.category,
        tags: dto.tags || [],
      },
    });

    await this.indexContent(content.id, dto.content);
    return this.toResponseDto(content);
  }

  private async indexContent(contentId: string, fullText: string) {
    await this.prisma.contentEmbedding.deleteMany({ where: { contentId } });
    const chunks = this.chunkText(fullText);

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const vector = await this.gemini.getEmbedding(chunkText);

      if (vector) {
        const embeddingId = crypto.randomUUID();
        const vectorStr = `[${vector.join(',')}]`;
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "ContentEmbedding" (id, "contentId", "chunkIndex", "textContent", embedding, "createdAt")
           VALUES ($1, $2, $3, $4, $5::vector, NOW())`,
          embeddingId,
          contentId,
          i,
          chunkText,
          vectorStr,
        );
      } else {
        await this.prisma.contentEmbedding.create({
          data: { contentId, chunkIndex: i, textContent: chunkText },
        });
      }
    }
  }

  async findAll(
    query: ContentQueryDto,
  ): Promise<PaginatedResult<ReturnType<ContentService['toResponseDto']>>> {
    const { page, limit, category, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContentWhereInput = {};
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.content.count({ where }),
    ]);

    const toDto = (item: (typeof items)[number]) => this.toResponseDto(item);

    // 검색어가 있을 때 결과 내에서만 TF-IDF 재정렬 (전체 DB 재조회 없음)
    if (search && items.length > 1) {
      const ranked = rankContents(search, items, limit);
      const rankedIds = ranked.map((r) => r.id);
      const reordered = rankedIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is NonNullable<typeof item> => item != null);
      return paginate(reordered.map(toDto), total, page, limit);
    }

    return paginate(items.map(toDto), total, page, limit);
  }

  async findOne(id: string) {
    const item = await this.prisma.content.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    return this.toResponseDto(item);
  }

  async findOneBySlug(slug: string) {
    const item = await this.prisma.content.findUnique({ where: { slug } });
    if (!item) throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    return this.toResponseDto(item);
  }

  async update(id: string, dto: UpdateContentDto) {
    const item = await this.prisma.content.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');

    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        title: dto.title ?? item.title,
        slug: dto.slug ?? item.slug,
        content: dto.content ?? item.content,
        category: dto.category ?? item.category,
        tags: dto.tags ?? item.tags,
      },
    });

    if (dto.content) await this.indexContent(updated.id, dto.content);
    return this.toResponseDto(updated);
  }

  async remove(id: string) {
    const item = await this.prisma.content.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    await this.prisma.content.delete({ where: { id } });
    return { id };
  }

  private toResponseDto(item: {
    id: string;
    title: string;
    slug: string;
    content: string;
    category: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      content: item.content,
      category: item.category,
      tags: item.tags,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
