import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HotspotQueryDto {
  @ApiProperty({ description: '시도 법정코드 (예: 11=서울)', example: '11' })
  @IsNotEmpty()
  @IsString()
  siDo!: string;

  @ApiProperty({
    description: '구군 법정코드 (예: 680=강남구)',
    example: '680',
  })
  @IsNotEmpty()
  @IsString()
  guGun!: string;

  @ApiPropertyOptional({
    description: '검색 연도 (기본: 2023)',
    default: '2023',
  })
  @IsOptional()
  @IsString()
  searchYearCd?: string;

  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '조회 건수', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
