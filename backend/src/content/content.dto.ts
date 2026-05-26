import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
  IsIn,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

const CONTENT_MAX = 50_000;
const TITLE_MAX = 200;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ALLOWED_CATEGORIES = [
  'license',
  'basics',
  'rules',
  'management',
  'accidents',
  'maintenance',
];

export class CreateContentDto {
  @ApiProperty({ example: '비보호 좌회전 완벽 가이드' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(TITLE_MAX)
  title: string;

  @ApiProperty({ example: 'rules-unprotected-left-turn' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  @Matches(SLUG_PATTERN, {
    message:
      'slug는 소문자/숫자/하이픈만 허용됩니다 (예: license-school-vs-self)',
  })
  slug: string;

  @ApiProperty({ example: '## 본문 마크다운 내용' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(CONTENT_MAX)
  content: string;

  @ApiProperty({ enum: ALLOWED_CATEGORIES, example: 'rules' })
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_CATEGORIES)
  category: string;

  @ApiPropertyOptional({ example: ['비보호', '좌회전'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  tags?: string[];
}

export class UpdateContentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(TITLE_MAX)
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(120)
  @Matches(SLUG_PATTERN, { message: 'slug는 소문자/숫자/하이픈만 허용됩니다' })
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(CONTENT_MAX)
  content?: string;

  @ApiPropertyOptional({ enum: ALLOWED_CATEGORIES })
  @IsString()
  @IsOptional()
  @IsIn(ALLOWED_CATEGORIES)
  category?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  tags?: string[];
}

export class ContentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ALLOWED_CATEGORIES })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '검색어 (제목·본문·태그)' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  search?: string;
}

export class ContentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() slug: string;
  @ApiProperty() content: string;
  @ApiProperty() category: string;
  @ApiProperty({ type: [String] }) tags: string[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
