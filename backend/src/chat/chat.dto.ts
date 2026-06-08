import {
  IsString,
  IsNotEmpty,
  IsIn,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

/**
 * 챗봇 답변에 첨부되는 출처 카드 — id/title/slug 만 노출.
 */
export interface MatchedSource {
  id: string;
  title: string;
  slug: string;
}

export class AskChatDto {
  @ApiProperty({ example: '비보호 좌회전은 어떻게 하나요?', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: '질문은 2자 이상이어야 합니다.' })
  @MaxLength(200, { message: '질문은 200자를 넘을 수 없습니다.' })
  message: string;

  @ApiProperty({ example: 'session-uuid-here', maxLength: 128 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  sessionKey: string;
}

export class FeedbackChatDto {
  @ApiProperty({ enum: ['like', 'dislike', 'none'] })
  @IsString()
  @IsIn(['like', 'dislike', 'none'])
  feedback: string;
}

export class ChatLogQueryDto extends PaginationQueryDto {}

export class ChatResponseDto {
  id: string;
  sessionKey: string;
  userMessage: string;
  botResponse: string;
  matchedSources: MatchedSource[] | null;
  feedback: string;
  createdAt: Date;

  constructor(partial: Partial<ChatResponseDto>) {
    Object.assign(this, partial);
  }
}
