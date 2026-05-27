import { IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InspectionQueryDto {
  @ApiProperty({
    example: '123가4567',
    description: '차량번호판 (예: 12가3456 또는 123가4567)',
  })
  @IsString()
  @MaxLength(10)
  @Matches(/^[0-9]{2,3}[가-힣][0-9]{4}$/, {
    message: '차량번호 형식이 올바르지 않습니다 (예: 123가4567)',
  })
  plate!: string;
}
