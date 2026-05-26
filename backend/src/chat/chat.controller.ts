import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { AskChatDto, FeedbackChatDto, ChatLogQueryDto } from './chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('ask')
  @Throttle({
    short: { ttl: 60_000, limit: 10 },
    long: { ttl: 3_600_000, limit: 60 },
  })
  @ApiOperation({ summary: '챗봇에게 질문 (RAG 또는 로컬 폴백)' })
  @ApiResponse({ status: 201, description: '챗봇 답변과 출처 카드' })
  ask(@Body() dto: AskChatDto) {
    return this.chatService.ask(dto);
  }

  @Post('feedback/:id')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: '답변에 좋아요/싫어요 피드백 등록' })
  feedback(@Param('id') id: string, @Body() dto: FeedbackChatDto) {
    return this.chatService.feedback(id, dto);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '대화 이력 조회 (관리자, 페이지네이션)' })
  @ApiResponse({ status: 200, description: 'PaginatedResult<ChatLog>' })
  getLogs(@Query() query: ChatLogQueryDto) {
    return this.chatService.getLogs(query);
  }
}
