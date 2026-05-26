import {
  IsString,
  IsNotEmpty,
  IsIn,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

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
