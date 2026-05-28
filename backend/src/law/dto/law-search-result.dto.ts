import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LawItemDto {
  @ApiProperty({ example: '100674', description: '법령 ID' })
  id!: string;

  @ApiProperty({ example: '도로교통법', description: '법령명' })
  name!: string;

  @ApiPropertyOptional({
    example: '법률',
    description: '법령 구분 (법률/대통령령/시행규칙 등)',
  })
  type?: string;

  @ApiPropertyOptional({ example: '경찰청', description: '소관 부처' })
  ministry?: string;

  @ApiPropertyOptional({ example: '20240101', description: '시행일자' })
  effectiveDate?: string;

  @ApiProperty({
    example: 'https://www.law.go.kr/법령/도로교통법',
    description: '법제처 원문 링크',
  })
  url!: string;
}

export class LawSearchResultDto {
  @ApiProperty({ type: [LawItemDto] })
  items!: LawItemDto[];

  @ApiProperty({ example: 5 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiPropertyOptional({ description: 'API 키 미설정 시 안내 메시지' })
  message?: string;
}
