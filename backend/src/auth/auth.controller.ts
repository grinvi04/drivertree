import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  Req,
  UseGuards,
  Request,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger'
import type { Response, Request as ExpressRequest } from 'express'
import { AuthService } from './auth.service'
import { LoginDto } from './auth.dto'
import { JwtAuthGuard } from './jwt-auth.guard'
import type { AuthUser } from './jwt.strategy'

type AuthedRequest = ExpressRequest & { user: AuthUser }

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관리자 로그인 — JWT httpOnly 쿠키 발급' })
  @ApiResponse({ status: 200, description: '{ username }' })
  @ApiResponse({ status: 401, description: '잘못된 자격증명' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { username, accessToken, refreshToken } = await this.authService.login(dto)

    res.cookie('access_token', accessToken, {
      ...COOKIE_BASE,
      maxAge: 15 * 60 * 1000, // 15분
    })
    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_BASE,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      path: '/api/auth',
    })

    return { username, accessToken }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: '액세스 토큰 갱신 (refresh_token 쿠키 필요)' })
  @ApiResponse({ status: 200, description: '새 액세스 토큰을 쿠키로 발급' })
  @ApiResponse({ status: 401, description: '리프레시 토큰 만료 또는 무효' })
  async refresh(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.['refresh_token']
    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 없습니다.')
    }

    const { accessToken } = await this.authService.refreshAccessToken(refreshToken)

    res.cookie('access_token', accessToken, {
      ...COOKIE_BASE,
      maxAge: 15 * 60 * 1000,
    })

    return { message: '액세스 토큰이 갱신되었습니다.' }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '로그아웃 — 쿠키 삭제 및 refresh token 무효화' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Request() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.userId)
    res.clearCookie('access_token', COOKIE_BASE)
    res.clearCookie('refresh_token', { ...COOKIE_BASE, path: '/api/auth' })
    return { message: '로그아웃 되었습니다.' }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '현재 로그인한 관리자 프로필 조회' })
  getProfile(@Request() req: AuthedRequest): AuthUser {
    return req.user
  }
}
