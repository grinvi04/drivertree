import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RecallQueryDto {
  @ApiPropertyOptional({ example: '아반떼', description: '차량 모델명' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  model?: string;

  @ApiPropertyOptional({ example: '현대', description: '제조사명' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  maker?: string;

  @ApiPropertyOptional({ example: 1, description: '페이지 번호 (기본값 1)' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: '페이지당 결과 수 (기본값 10, 최대 20)',
  })
  @IsOptional()
  limit?: number;
}
