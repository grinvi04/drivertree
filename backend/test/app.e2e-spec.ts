import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([])],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api → 200, status ok, service drivetree-backend', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect((res) => {
        const body = res.body as { status: string; service: string };
        expect(body.status).toBe('ok');
        expect(body.service).toBe('drivetree-backend');
      });
  });

  it('GET /api/health → 200, status ok, uptime(number), timestamp(ISO string)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          status: string;
          uptime: number;
          timestamp: string;
        };
        expect(body.status).toBe('ok');
        expect(typeof body.uptime).toBe('number');
        expect(isNaN(Date.parse(body.timestamp))).toBe(false);
      });
  });
});
