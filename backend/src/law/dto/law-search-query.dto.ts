import { IsString, MaxLength, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LawSearchQueryDto {
  @ApiProperty({ example: '비보호좌회전', description: '검색할 법령 키워드' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  query!: string;

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
