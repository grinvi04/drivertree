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

/**
 * 콘텐츠 본문 상한 — 50,000자(약 25KB 평문, 충분히 긴 가이드 글 분량).
 * 임베딩 비용 + 메모리 사용량 폭주 방지 + 악의적 거대 페이로드 차단.
 */
const CONTENT_MAX = 50_000;
const TITLE_MAX = 200;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_CATEGORIES = ['license', 'basics', 'rules', 'management', 'accidents'];

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(TITLE_MAX)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  @Matches(SLUG_PATTERN, {
    message: 'slug는 소문자/숫자/하이픈만 허용됩니다 (예: license-school-vs-self)',
  })
  slug: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(CONTENT_MAX)
  content: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_CATEGORIES)
  category: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  tags?: string[];
}

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(TITLE_MAX)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(120)
  @Matches(SLUG_PATTERN, {
    message: 'slug는 소문자/숫자/하이픈만 허용됩니다',
  })
  slug?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(CONTENT_MAX)
  content?: string;

  @IsString()
  @IsOptional()
  @IsIn(ALLOWED_CATEGORIES)
  category?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  tags?: string[];
}
