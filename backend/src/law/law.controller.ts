import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LawService } from './law.service';
import { LawSearchQueryDto } from './dto/law-search-query.dto';
import { LawSearchResultDto } from './dto/law-search-result.dto';

@ApiTags('law')
@Controller('law')
export class LawController {
  constructor(private readonly lawService: LawService) {}

  @Get('search')
  @ApiOperation({
    summary: '법령 검색',
    description:
      '법제처 국가법령정보 API 기반. 도로교통 관련 법령을 키워드로 검색합니다.',
  })
  search(@Query() query: LawSearchQueryDto): Promise<LawSearchResultDto> {
    return this.lawService.search(query);
  }
}
