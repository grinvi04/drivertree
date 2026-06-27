import { IsString, IsNotEmpty, IsIn, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { PaginationQueryDto } from '../common/dto/pagination.dto'

export class MatchedSource {
  @ApiProperty({ example: 'content-uuid' })
  id: string

  @ApiProperty({ example: '비보호 좌회전 방법' })
  title: string

  @ApiProperty({ example: 'unprotected-left-turn' })
  slug: string
}

export class AskChatDto {
  @ApiProperty({ example: '비보호 좌회전은 어떻게 하나요?', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: '질문은 2자 이상이어야 합니다.' })
  @MaxLength(200, { message: '질문은 200자를 넘을 수 없습니다.' })
  message: string

  @ApiProperty({ example: 'session-uuid-here', maxLength: 128 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  sessionKey: string
}

export class FeedbackChatDto {
  @ApiProperty({ enum: ['like', 'dislike', 'none'] })
  @IsString()
  @IsIn(['like', 'dislike', 'none'])
  feedback: string
}

export class ChatLogQueryDto extends PaginationQueryDto {}

export class ChatResponseDto {
  @ApiProperty({ example: 'chat-uuid' })
  id: string

  @ApiProperty({ example: 'session-uuid' })
  sessionKey: string

  @ApiProperty({ example: '비보호 좌회전은 어떻게 하나요?' })
  userMessage: string

  @ApiProperty({ example: '비보호 좌회전은 신호 없이...' })
  botResponse: string

  @ApiProperty({ type: () => MatchedSource, isArray: true, nullable: true })
  matchedSources: MatchedSource[] | null

  @ApiProperty({ enum: ['like', 'dislike', 'none'], example: 'none' })
  feedback: string

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date

  constructor(partial: Partial<ChatResponseDto>) {
    Object.assign(this, partial)
  }
}
