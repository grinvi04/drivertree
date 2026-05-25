import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

/**
 * Prisma 7부터 PrismaClient는 driver adapter 또는 Prisma Accelerate URL이 필수.
 * 로컬 PostgreSQL + pgvector 환경에서는 node-postgres(pg) 기반 PrismaPg 어댑터를 사용한다.
 *
 * 사전 조건:
 *   1) schema.prisma 의 generator client.previewFeatures에 "driverAdapters" 포함
 *   2) `npm i @prisma/adapter-pg pg` (devDeps: @types/pg)
 *   3) `npx prisma generate`
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL 환경 변수가 비어 있습니다. backend/.env 파일을 확인해주세요.',
      );
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
