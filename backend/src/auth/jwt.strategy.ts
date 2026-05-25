import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JWT 페이로드 형태 — auth.service.login() 에서 sign 시 동일 형태로 넣어준다.
 * sub: admin DB id, username: admin username
 */
export interface JwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * 인증 컨텍스트에 주입될 사용자 정보 — @Request() req.user 의 타입.
 */
export interface AuthUser {
  userId: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'drivetree_super_secret_jwt_key_9876!',
    });
  }

  /**
   * passport-jwt 가 토큰 검증 성공 후 호출 — 반환값이 req.user 에 매핑됨.
   * 외부 lookup이 필요하면 async로 바꾸지만 현재는 페이로드 매핑만 하므로 동기.
   */
  validate(payload: JwtPayload): AuthUser {
    return { userId: payload.sub, username: payload.username };
  }
}
