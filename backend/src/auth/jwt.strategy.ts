import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  userId: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // httpOnly 쿠키 우선, 없으면 Bearer 헤더 (Swagger/CLI 호환)
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          (req?.cookies as Record<string, string> | undefined)?.[
            'access_token'
          ] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'drivetree_super_secret_jwt_key_9876!',
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return { userId: payload.sub, username: payload.username };
  }
}
