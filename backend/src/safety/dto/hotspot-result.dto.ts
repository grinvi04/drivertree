import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HotspotItemDto {
  @ApiProperty() spotNm!: string;
  @ApiProperty() siDo!: string;
  @ApiProperty() guGun!: string;
  @ApiPropertyOptional() dong?: string;
  @ApiPropertyOptional() spotType?: string;
  @ApiProperty() accCnt!: number;
  @ApiProperty() dthCnt!: number;
  @ApiProperty() injCnt!: number;
  @ApiPropertyOptional() startYear?: string;
  @ApiPropertyOptional() endYear?: string;
}

export class HotspotResultDto {
  @ApiProperty({ type: [HotspotItemDto] }) items!: HotspotItemDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiPropertyOptional() message?: string;
}
