import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HotspotItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() totalAccCnt!: number;
  @ApiProperty() deathCnt!: number;
  @ApiProperty() seriousInjuryCnt!: number;
  @ApiProperty() slightInjuryCnt!: number;
  @ApiProperty() woundCnt!: number;
  @ApiProperty() centerX!: number;
  @ApiProperty() centerY!: number;
  @ApiProperty({ type: [String] }) causes!: string[];
}

export class HotspotResultDto {
  @ApiProperty({ type: [HotspotItemDto] }) items!: HotspotItemDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiPropertyOptional() message?: string;
}
