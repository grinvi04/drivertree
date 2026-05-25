import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController (health endpoints)', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('GET / (root)', () => {
    it('responds with service identity + ok status', () => {
      const res = appController.getHello();
      expect(res.status).toBe('ok');
      expect(res.service).toBe('drivetree-backend');
      expect(typeof res.version).toBe('string');
      expect(res.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('GET /health', () => {
    it('responds with ok + numeric uptime + ISO timestamp', () => {
      const res = appController.health();
      expect(res.status).toBe('ok');
      expect(typeof res.uptime).toBe('number');
      expect(res.uptime).toBeGreaterThanOrEqual(0);
      expect(res.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
