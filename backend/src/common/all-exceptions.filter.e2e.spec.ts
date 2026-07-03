import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ChatController } from '../chat/chat.controller';
import { ChatService } from '../chat/chat.service';
import { AllExceptionsFilter } from './all-exceptions.filter';

/**
 * 공개 엔드포인트 /api/chat/ask 의 입력오류 매핑 e2e.
 *
 * body-parser 단계에서 거부되는 깨진 JSON·과대 바디는 컨트롤러(ChatService)에 도달하지 않으므로
 * ChatService 를 mock 으로 주입해 DB 없이 필터+파서 동작만 검증한다. (T1-1)
 */
describe('AllExceptionsFilter (e2e) — /api/chat/ask 입력오류', () => {
  let app: INestApplication<App>;
  const askMock = jest.fn();

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: { ask: askMock } }],
    }).compile();

    app = moduleRef.createNestApplication();
    // main.ts 와 동일 구성으로 운영과 동치
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    askMock.mockReset();
  });

  it('깨진 JSON 바디 → 400 (500 아님), Sentry 미발생 경로', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/chat/ask')
      .set('Content-Type', 'application/json')
      .send('{"message": "안녕"'); // 닫히지 않은 JSON

    expect(res.status).toBe(400);
    expect(askMock).not.toHaveBeenCalled();
  });

  it('본문 크기 한도 초과 → 413 (500 아님)', async () => {
    const huge = 'a'.repeat(200 * 1024); // 기본 100kb 한도 초과
    const res = await request(app.getHttpServer())
      .post('/api/chat/ask')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ message: huge, sessionKey: 's' }));

    expect(res.status).toBe(413);
    expect(askMock).not.toHaveBeenCalled();
  });

  it('정상 JSON → 컨트롤러 도달(201)', async () => {
    askMock.mockResolvedValue({ id: 'log-1', botResponse: 'ok' });
    const res = await request(app.getHttpServer())
      .post('/api/chat/ask')
      .send({ message: '비보호 좌회전이 뭐예요', sessionKey: 'sess-1' });

    expect(res.status).toBe(201);
    expect(askMock).toHaveBeenCalledTimes(1);
  });
});
