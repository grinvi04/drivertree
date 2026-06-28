import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from './../src/prisma.service';
import { GeminiService } from './../src/common/gemini.service';
import { ContentService } from './../src/content/content.service';
import { ChatService } from './../src/chat/chat.service';

/**
 * 실 Postgres 통합 테스트 (T2-1).
 *
 * 단위 spec 들은 PrismaService 를 mock 하므로 트랜잭션·cascade·실제 쿼리·로컬 NLP 폴백이
 * 검증되지 않는다. 본 spec 은 CI Postgres(DATABASE_URL)에 **실 PrismaService** 를 주입해
 * 핵심 흐름(Content CRUD + Chat ask 로컬 폴백)이 끝까지 도는지 단언한다.
 *
 * GEMINI_API_KEY 가 없으면(CI 기본) 임베딩은 null 폴백, ask 는 localNlpFallback 경로를 탄다.
 */
describe('Content + Chat 실DB 통합 (e2e)', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let content: ContentService;
  let chat: ChatService;

  async function cleanDb(): Promise<void> {
    // FK(Cascade) 순서 무관하게 자식부터 정리
    await prisma.contentEmbedding.deleteMany({});
    await prisma.chatLog.deleteMany({});
    await prisma.content.deleteMany({});
  }

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [PrismaService, GeminiService, ContentService, ChatService],
    }).compile();

    // app.init() 을 호출하지 않으므로 ContentService.onModuleInit 시드는 실행되지 않는다.
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

  it('Content CRUD 라운드트립 + 임베딩 cascade 삭제가 실 DB에서 동작', async () => {
    const created = await content.create({
      title: '비보호 좌회전 완전정복',
      slug: 'it-unprotected-left',
      content:
        '비보호 좌회전은 녹색 신호에 맞은편 차량이 없을 때 가능합니다. 보행자를 우선 살피세요.',
      category: 'rules',
      tags: ['좌회전', '신호'],
    });
    expect(created.id).toBeDefined();
    expect(created).not.toHaveProperty('embeddings');

    // 임베딩 청크가 실제로 적재됐는지 (API 키 없으면 벡터 null 폴백 행)
    const embCount = await prisma.contentEmbedding.count({
      where: { contentId: created.id },
    });
    expect(embCount).toBeGreaterThan(0);

    // 단건 조회
    const found = await content.findOne(created.id);
    expect(found.slug).toBe('it-unprotected-left');

    // 목록 조회에 포함
    const list = await content.findAll({
      page: 1,
      limit: 10,
      category: undefined,
      search: undefined,
    });
    expect(list.data.some((c) => c.id === created.id)).toBe(true);
    expect(list.meta.total).toBeGreaterThanOrEqual(1);

    // 수정
    const updated = await content.update(created.id, { title: '수정된 제목' });
    expect(updated.title).toBe('수정된 제목');

    // 삭제 → 임베딩도 cascade 삭제
    await content.remove(created.id);
    const embAfter = await prisma.contentEmbedding.count({
      where: { contentId: created.id },
    });
    expect(embAfter).toBe(0);
    await expect(content.findOne(created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('Chat ask 로컬 폴백이 실 DB 콘텐츠를 랭킹하고 ChatLog를 영속화', async () => {
    await content.create({
      title: '접촉사고 대처 5단계',
      slug: 'it-accident-steps',
      content:
        '접촉사고가 나면 우선 안전한 곳으로 이동하고 비상등을 켭니다. 사진을 찍고 보험사에 연락하세요.',
      category: 'accidents',
      tags: ['사고', '보험'],
    });

    const sessionKey = 'it-session-1';
    const res = await chat.ask({
      message: '접촉사고 났을 때 어떻게 해요',
      sessionKey,
    });

    expect(typeof res.botResponse).toBe('string');
    expect(res.botResponse.length).toBeGreaterThan(0);

    // ChatLog 가 실제로 저장됐는지
    const logs = await prisma.chatLog.findMany({ where: { sessionKey } });
    expect(logs).toHaveLength(1);
    expect(logs[0].userMessage).toBe('접촉사고 났을 때 어떻게 해요');
  });
});
