import {
  IsString,
  IsNotEmpty,
  IsIn,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AskChatDto {
  // 프롬프트 인젝션 방어: 200자 제한으로 jailbreak용 긴 프롬프트 차단
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: '질문은 2자 이상이어야 합니다.' })
  @MaxLength(200, { message: '질문은 200자를 넘을 수 없습니다.' })
  message: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  sessionKey: string;
}

export class FeedbackChatDto {
  @IsString()
  @IsIn(['like', 'dislike', 'none'])
  feedback: string;
}
