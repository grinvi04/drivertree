import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './auth.dto';
import type { JwtPayload } from './jwt.strategy';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const username = process.env.ADMIN_USERNAME?.trim() || 'admin';
    const envPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!envPassword && process.env.NODE_ENV === 'production') {
      throw new Error(
        'ADMIN_PASSWORD environment variable must be set in production.',
      );
    }

    const defaultPassword = 'drivetreeadmin123!';
    const password = envPassword || defaultPassword;
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await this.prisma.admin.findUnique({
      where: { username },
    });

    if (!existing) {
      await this.prisma.admin.create({
        data: { username, passwordHash },
      });
      this.logger.log(`[Seed] Admin account created: username="${username}"`);
      if (envPassword) {
        this.logger.log(
          '[Seed] Password sourced from ADMIN_PASSWORD env (value hidden).',
        );
      } else {
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn(
            `[Seed] Using DEV DEFAULT password: ${defaultPassword}`,
          );
        }
        this.logger.warn(
          '[Seed] ADMIN_PASSWORD env is NOT set — set it before production deploy!',
        );
      }
      return;
    }

    if (envPassword) {
      const sameAsExisting = await bcrypt.compare(
        password,
        existing.passwordHash,
      );
      if (!sameAsExisting) {
        await this.prisma.admin.update({
          where: { id: existing.id },
          data: { passwordHash },
        });
        this.logger.log(
          `[Seed] Admin password rotated for username="${username}" via ADMIN_PASSWORD env.`,
        );
      }
    }
  }

  private get refreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_REFRESH_SECRET environment variable is required. Set it in the .env file.',
      );
    }
    return secret;
  }

  async login(
    dto: LoginDto,
  ): Promise<{ username: string; accessToken: string; refreshToken: string }> {
    const admin = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });

    if (!admin) {
      throw new UnauthorizedException('존재하지 않는 관리자 아이디입니다.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      admin.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: admin.id,
      username: admin.username,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: '7d',
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { refreshTokenHash },
    });

    return { username: admin.username, accessToken, refreshToken };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(
        '리프레시 토큰이 만료되었거나 유효하지 않습니다.',
      );
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
    });
    if (!admin?.refreshTokenHash) {
      throw new UnauthorizedException(
        '세션이 만료되었습니다. 다시 로그인하세요.',
      );
    }

    const isValid = await bcrypt.compare(refreshToken, admin.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }

    const accessToken = this.jwtService.sign({
      sub: admin.id,
      username: admin.username,
    });
    return { accessToken };
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.admin.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }
}
