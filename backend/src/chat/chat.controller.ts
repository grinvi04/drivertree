import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { AskChatDto, FeedbackChatDto } from './chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Gemini API 비용 보호: 분당 10회, 시간당 60회로 제한
  // (글로벌 60/min 보다 훨씬 엄격, 짧은 시간 폭주 + 장기 사용량 모두 보호)
  @Post('ask')
  @Throttle({
    short: { ttl: 60_000, limit: 10 },
    long: { ttl: 3_600_000, limit: 60 },
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  ask(@Body() askChatDto: AskChatDto) {
    return this.chatService.ask(askChatDto);
  }

  // 피드백은 빠른 클릭이 가능해야 하므로 글로벌 기본값보다 살짝만 완화
  @Post('feedback/:id')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  feedback(@Param('id') id: string, @Body() feedbackChatDto: FeedbackChatDto) {
    return this.chatService.feedback(id, feedbackChatDto);
  }

  @Get('logs')
  getLogs() {
    return this.chatService.getLogs();
  }
}
