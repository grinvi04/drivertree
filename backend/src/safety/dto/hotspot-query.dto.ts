import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HotspotQueryDto {
  @ApiProperty({ description: '시도명', example: '서울특별시' })
  @IsNotEmpty()
  @IsString()
  siDo!: string;

  @ApiPropertyOptional({ description: '구군명', example: '강남구' })
  @IsOptional()
  @IsString()
  guGun?: string;

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
