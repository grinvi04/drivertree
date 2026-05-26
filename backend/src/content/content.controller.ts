import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ContentService } from './content.service';
import {
  CreateContentDto,
  UpdateContentDto,
  ContentQueryDto,
  ContentResponseDto,
} from './content.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '콘텐츠 생성 (관리자)' })
  @ApiResponse({ status: 201, type: ContentResponseDto })
  create(@Body() dto: CreateContentDto) {
    return this.contentService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '콘텐츠 목록 조회 (페이지네이션)' })
  @ApiResponse({
    status: 200,
    description: 'PaginatedResult<ContentResponseDto>',
  })
  findAll(@Query() query: ContentQueryDto) {
    return this.contentService.findAll(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'slug로 콘텐츠 단건 조회' })
  @ApiParam({ name: 'slug', example: 'rules-unprotected-left-turn' })
  @ApiResponse({ status: 200, type: ContentResponseDto })
  findOneBySlug(@Param('slug') slug: string) {
    return this.contentService.findOneBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID로 콘텐츠 단건 조회' })
  @ApiResponse({ status: 200, type: ContentResponseDto })
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '콘텐츠 수정 (관리자)' })
  @ApiResponse({ status: 200, type: ContentResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.contentService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '콘텐츠 삭제 (관리자)' })
  @ApiResponse({ status: 200, description: '{ id: string }' })
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }
}
