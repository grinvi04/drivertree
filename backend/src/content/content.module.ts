import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';

@Module({
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService], // ChatModule 등에서 가이드 콘텐츠 목록을 읽어가기 위해 export 함
})
export class ContentModule {}
