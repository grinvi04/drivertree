import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthUser } from './jwt.strategy';

type AuthedRequest = ExpressRequest & { user: AuthUser };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '관리자 로그인 — JWT 토큰 발급' })
  @ApiResponse({ status: 201, description: '{ accessToken, username }' })
  @ApiResponse({ status: 401, description: '잘못된 자격증명' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 로그인한 관리자 프로필 조회' })
  getProfile(@Request() req: AuthedRequest): AuthUser {
    return req.user;
  }
}
