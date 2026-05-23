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
   * 백엔드 서버 시작 시 관리자 계정을 시드합니다.
   *
   * 동작:
   * 1) ADMIN_USERNAME / ADMIN_PASSWORD 환경변수가 있으면 그 값으로 시드(권장: 운영).
   *    미설정 시 로컬 개발용 기본값(admin / drivetreeadmin123!) 사용.
   * 2) 동일 username의 계정이 이미 있고 ADMIN_PASSWORD env가 설정되어 있다면,
   *    저장된 해시와 비교하여 *변경 감지 시에만* 비밀번호를 동기화한다.
   *    → Railway/Vercel 등에서 ADMIN_PASSWORD env를 갱신 후 재배포만으로 비밀번호 회전 완료.
   * 3) env 비밀번호는 절대 평문 로그에 찍지 않는다(Railway 로그 누출 방지).
   */
  async onModuleInit() {
    const username = process.env.ADMIN_USERNAME?.trim() || 'admin';
    const envPassword = process.env.ADMIN_PASSWORD?.trim();
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
      console.log('----------------------------------------------------');
      console.log(`🎉 [DriveTree Seed] Admin account created: ${username}`);
      if (envPassword) {
        console.log('🔒 Password sourced from ADMIN_PASSWORD env (value hidden).');
      } else {
        console.log(`🔑 Password (DEV DEFAULT): ${defaultPassword}`);
        console.log('⚠️  Set ADMIN_PASSWORD env in production!');
      }
      console.log('----------------------------------------------------');
      return;
    }

    // 이미 계정이 있는 경우 — env로 받은 새 비밀번호와 다를 때만 갱신
    if (envPassword) {
      const sameAsExisting = await bcrypt.compare(password, existing.passwordHash);
      if (!sameAsExisting) {
        await this.prisma.admin.update({
          where: { id: existing.id },
          data: { passwordHash },
        });
        console.log(`🔄 [DriveTree Seed] Admin password rotated for ${username} via ADMIN_PASSWORD env.`);
      }
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
