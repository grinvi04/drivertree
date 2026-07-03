import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from './../src/prisma.service';
import { GeminiService } from './../src/common/gemini.service';
import { ContentService } from './../src/content/content.service';
import { ChatService } from './../src/chat/chat.service';

/**
 * Content 소프트삭제 실DB 통합 테스트 (T2-2).
 *
 * remove() 가 물리삭제 대신 deletedAt 을 기록하고, 비활성 콘텐츠가 공개 목록/단건/슬러그/
 * 챗 로컬 폴백 검색에서 제외되는지 + 임베딩 이력이 보존되는지 실 Postgres 에서 단언한다.
 */
describe('Content 소프트삭제 (e2e)', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let content: ContentService;
  let chat: ChatService;

  async function cleanDb(): Promise<void> {
    await prisma.contentEmbedding.deleteMany({});
    await prisma.chatLog.deleteMany({});
    await prisma.content.deleteMany({});
  }

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [PrismaService, GeminiService, ContentService, ChatService],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    content = moduleRef.get(ContentService);
    chat = moduleRef.get(ChatService);
    await prisma.$connect();
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
    await moduleRef.close();
  });

  it('soft-delete 후 단건·슬러그·목록·임베딩검색에서 제외되고 임베딩 이력은 보존', async () => {
    const created = await content.create({
      title: '세차 방법 완전정복',
      slug: 'sd-car-wash',
      content:
        '셀프 세차장에서는 고압수로 먼저 흙먼지를 제거한 뒤 폼건으로 거품을 도포합니다.',
      category: 'management',
      tags: ['세차', '관리'],
    });

    // 소프트삭제
    const res = await content.remove(created.id);
    expect(res).toEqual({ id: created.id });

    // DB 행은 남아있고 deletedAt 이 기록됨 (물리삭제 아님)
    const row = await prisma.content.findUnique({ where: { id: created.id } });
    expect(row).not.toBeNull();
    expect(row?.deletedAt).toBeInstanceOf(Date);

    // 임베딩 이력 보존 (cascade 물리삭제로 소실되지 않음)
    const embCount = await prisma.contentEmbedding.count({
      where: { contentId: created.id },
    });
    expect(embCount).toBeGreaterThan(0);

    // 단건/슬러그 조회에서 제외 (NotFound)
    await expect(content.findOne(created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(content.findOneBySlug('sd-car-wash')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    // 목록 조회에서 제외
    const list = await content.findAll({
      page: 1,
      limit: 50,
      category: undefined,
      search: undefined,
    });
    expect(list.data.some((c) => c.id === created.id)).toBe(false);
  });

  it('soft-delete 된 콘텐츠는 챗 로컬 폴백 출처에서 제외', async () => {
    await cleanDb();
    const created = await content.create({
      title: '비보호 좌회전 규칙',
      slug: 'sd-unprotected-left',
      content:
        '비보호 좌회전은 녹색 신호에 맞은편 직진 차량이 없을 때만 가능합니다.',
      category: 'rules',
      tags: ['좌회전'],
    });
    await content.remove(created.id);

    const ask = await chat.ask({
      message: '비보호 좌회전 어떻게 하나요',
      sessionKey: 'sd-session',
    });

    const sourceIds = (ask.matchedSources ?? []).map((s) => s.id);
    expect(sourceIds).not.toContain(created.id);
  });
});
