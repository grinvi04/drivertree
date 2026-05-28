import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SafetyService } from './safety.service';
import { HotspotQueryDto } from './dto/hotspot-query.dto';
import { HotspotResultDto } from './dto/hotspot-result.dto';

@ApiTags('safety')
@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Get('hotspots')
  @ApiOperation({ summary: '교통사고 다발지점 조회 (TAAS)' })
  getHotspots(@Query() query: HotspotQueryDto): Promise<HotspotResultDto> {
    return this.safetyService.getHotspots(query);
  }
}
