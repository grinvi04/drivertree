import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * 백엔드 서버 시작 시 관리자 계정이 비어있다면 디폴트 계정을 자동 생성(Seeding)합니다.
   */
  async onModuleInit() {
    const adminCount = await this.prisma.admin.count();
    if (adminCount === 0) {
      const defaultUsername = 'admin';
      const defaultPassword = 'drivetreeadmin123!';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      await this.prisma.admin.create({
        data: {
          username: defaultUsername,
          passwordHash,
        }
      });

      console.log('----------------------------------------------------');
      console.log('🎉 [DriveTree Seed] Default Admin Account Created!');
      console.log(`👤 Username: ${defaultUsername}`);
      console.log(`🔑 Password: ${defaultPassword}`);
      console.log('⚠️  Please change this password in production environment!');
      console.log('----------------------------------------------------');
    }
  }

  /**
   * 관리자 계정 로그인을 처리하고 JWT 토큰을 발급합니다.
   */
  async login(dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { username: dto.username }
    });

    if (!admin) {
      throw new UnauthorizedException('존재하지 않는 관리자 아이디입니다.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    const payload = { sub: admin.id, username: admin.username };
    
    return {
      accessToken: this.jwtService.sign(payload),
      username: admin.username,
    };
  }
}
