import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CarService } from './car.service';
import { RecallQueryDto } from './dto/recall-query.dto';
import { RecallResultDto } from './dto/recall-result.dto';
import { InspectionQueryDto } from './dto/inspection-query.dto';
import { InspectionResultDto } from './dto/inspection-result.dto';

@ApiTags('car')
@Controller('car')
export class CarController {
  constructor(private readonly carService: CarService) {}

  @Get('recall')
  @ApiOperation({
    summary: '자동차 리콜 조회',
    description:
      '국토교통부 공공데이터 기반. 차량명 또는 제조사명으로 리콜 이력을 조회합니다.',
  })
  getRecalls(@Query() query: RecallQueryDto): Promise<RecallResultDto> {
    return this.carService.getRecalls(query);
  }

  @Get('inspection')
  @ApiOperation({
    summary: '정기검사 유효기간 조회',
    description:
      '교통안전공단 공공데이터 기반. 차량번호로 정기검사 만료일을 조회합니다.',
  })
  getInspection(
    @Query() query: InspectionQueryDto,
  ): Promise<InspectionResultDto> {
    return this.carService.getInspection(query);
  }
}
