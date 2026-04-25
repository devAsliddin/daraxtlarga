import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { BlockchainService } from '../../../common/blockchain/blockchain.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

const mockConfig = {
  get: jest.fn((key: string, def?: any) => def),
};

const mockBlockchain = {
  generateWallet: jest.fn().mockReturnValue({
    publicKey: 'pk',
    privateKey: 'sk',
    address: 'YQ1234567890',
  }),
  encryptWalletKey: jest.fn().mockReturnValue('iv:authtag:ciphertext'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: BlockchainService, useValue: mockBlockchain },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('should register a new user successfully', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        username: 'TestUser',
        level: 1,
        xp: 0,
        totalTokens: 0,
        walletAddress: 'YQ123',
        region: 'Toshkent',
        avatarUrl: null,
      });
      mockPrisma.refreshToken.upsert.mockResolvedValue({});

      const result = await service.register({
        email: 'test@test.com',
        username: 'TestUser',
        password: 'password123',
        region: 'Toshkent',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.register({
        email: 'existing@test.com',
        username: 'NewUser',
        password: 'password123',
      })).rejects.toThrow(ConflictException);
    });

    it('should hash password before saving', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(async ({ data }) => {
        expect(data.passwordHash).not.toBe('plainpassword');
        const isHashed = await bcrypt.compare('plainpassword', data.passwordHash);
        expect(isHashed).toBe(true);
        return { ...data, id: 'user-2' };
      });
      mockPrisma.refreshToken.upsert.mockResolvedValue({});

      await service.register({
        email: 'new@test.com',
        username: 'NewUser',
        password: 'plainpassword',
      });
    });

    it('should encrypt walletPrivKey before saving (not store raw PEM)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(async ({ data }) => {
        // walletPrivKey must be the encrypted value returned by encryptWalletKey mock
        expect(data.walletPrivKey).toBe('iv:authtag:ciphertext');
        expect(data.walletPrivKey).not.toBe('sk'); // raw private key from generateWallet
        return { ...data, id: 'user-3' };
      });
      mockPrisma.refreshToken.upsert.mockResolvedValue({});

      await service.register({
        email: 'secure@test.com',
        username: 'SecureUser',
        password: 'password123',
      });

      expect(mockBlockchain.encryptWalletKey).toHaveBeenCalledWith('sk', expect.any(String));
    });
  });

  describe('login()', () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@test.com',
      username: 'TestUser',
      level: 1,
      xp: 100,
      totalTokens: 50,
      walletAddress: 'YQ123',
      region: 'Toshkent',
      avatarUrl: null,
      passwordHash: '', // Will be set in tests
    };

    it('should login with correct credentials', async () => {
      const hash = await bcrypt.hash('correctpassword', 12);
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, passwordHash: hash });
      mockPrisma.refreshToken.upsert.mockResolvedValue({});

      const result = await service.login('user@test.com', 'correctpassword');
      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('user@test.com');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correctpassword', 12);
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, passwordHash: hash });

      await expect(service.login('user@test.com', 'wrongpassword'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login('nouser@test.com', 'password'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout()', () => {
    it('should delete refresh tokens on logout', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('user-1');
      expect(result.message).toBeTruthy();
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
