import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InspectionResultDto {
  @ApiProperty({ example: '123가4567', description: '차량번호' })
  plate!: string;

  @ApiPropertyOptional({
    example: '2025-09-30',
    description: '검사 유효기간 만료일',
  })
  expiryDate?: string;

  @ApiPropertyOptional({ example: '정기검사', description: '검사 종류' })
  inspectionType?: string;

  @ApiProperty({ example: true, description: '검사 기한 경과 여부' })
  isExpired!: boolean;

  @ApiPropertyOptional({
    example: 45,
    description: '만료까지 남은 일수 (음수면 경과)',
  })
  daysUntilExpiry?: number;

  @ApiPropertyOptional({ description: '공공 API 미연동 시 안내 메시지' })
  message?: string;
}
