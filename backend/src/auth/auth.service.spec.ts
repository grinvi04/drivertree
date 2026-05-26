import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

const HASHED_PW = bcrypt.hashSync('correct_password', 10);
const HASHED_RT = bcrypt.hashSync('valid_refresh_token', 10);

const adminStub = {
  id: 'admin-uuid-1',
  username: 'admin',
  passwordHash: HASHED_PW,
  refreshTokenHash: HASHED_RT,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makePrismaStub() {
  return {
    admin: {
      findUnique: jest.fn().mockResolvedValue(adminStub),
      create: jest.fn().mockResolvedValue(adminStub),
      update: jest.fn().mockResolvedValue(adminStub),
    },
  } as unknown as PrismaService;
}

function makeJwtStub() {
  return {
    sign: jest.fn().mockReturnValue('signed_token'),
    verify: jest
      .fn()
      .mockReturnValue({ sub: adminStub.id, username: adminStub.username }),
  } as unknown as JwtService;
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrismaStub>;
  let jwtService: ReturnType<typeof makeJwtStub>;

  beforeEach(async () => {
    prisma = makePrismaStub();
    jwtService = makeJwtStub();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('login()', () => {
    it('returns accessToken, refreshToken and username on valid credentials', async () => {
      const result = await service.login({
        username: 'admin',
        password: 'correct_password',
      });
      expect(result.username).toBe('admin');
      expect(result.accessToken).toBe('signed_token');
      expect(result.refreshToken).toBe('signed_token');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const updateMock = prisma.admin.update as jest.Mock;
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: adminStub.id } }),
      );
    });

    it('throws UnauthorizedException when admin not found', async () => {
      (prisma.admin.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(
        service.login({ username: 'nobody', password: 'pw' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException on wrong password', async () => {
      await expect(
        service.login({ username: 'admin', password: 'wrong_password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refreshAccessToken()', () => {
    it('returns new accessToken when refresh token is valid and matches DB hash', async () => {
      const result = await service.refreshAccessToken('valid_refresh_token');
      expect(result.accessToken).toBe('signed_token');
    });

    it('throws when refresh token JWT verification fails', async () => {
      (jwtService.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('jwt expired');
      });
      await expect(
        service.refreshAccessToken('expired_token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when admin has no refreshTokenHash (logged out)', async () => {
      (prisma.admin.findUnique as jest.Mock).mockResolvedValueOnce({
        ...adminStub,
        refreshTokenHash: null,
      });
      await expect(
        service.refreshAccessToken('some_token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when refresh token does not match stored hash (token reuse attack)', async () => {
      await expect(
        service.refreshAccessToken('tampered_token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout()', () => {
    it('nullifies refreshTokenHash in DB', async () => {
      await service.logout(adminStub.id);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const updateMock = prisma.admin.update as jest.Mock;
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: adminStub.id },
        data: { refreshTokenHash: null },
      });
    });
  });
});
