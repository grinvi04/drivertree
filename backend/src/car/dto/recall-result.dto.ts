import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecallItemDto {
  @ApiProperty({ example: '아반떼 CN7', description: '차량명' })
  model!: string;

  @ApiProperty({ example: '현대', description: '제조사' })
  maker!: string;

  @ApiProperty({ example: '2021-03-15', description: '리콜 개시일' })
  recallDate!: string;

  @ApiProperty({
    example: '연료펌프 결함으로 엔진 정지 가능성',
    description: '결함 내용',
  })
  defect!: string;

  @ApiProperty({ example: '연료펌프 교체', description: '시정 방법' })
  remedy!: string;

  @ApiPropertyOptional({ example: '1588-0100', description: '제조사 고객센터' })
  contact?: string;
}

export class RecallResultDto {
  @ApiProperty({ type: [RecallItemDto] })
  items!: RecallItemDto[];

  @ApiProperty({ example: 3 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;
}
