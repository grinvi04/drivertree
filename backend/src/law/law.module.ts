import { Module } from '@nestjs/common';
import { LawController } from './law.controller';
import { LawService } from './law.service';

@Module({
  controllers: [LawController],
  providers: [LawService],
})
export class LawModule {}
