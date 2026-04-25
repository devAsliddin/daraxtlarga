import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BlockchainService } from '../../common/blockchain/blockchain.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private blockchain: BlockchainService,
  ) {}

  async register(dto: RegisterDto) {
    // Check existing
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new ConflictException('Foydalanuvchi allaqachon mavjud');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const wallet = this.blockchain.generateWallet();
    const encryptionSecret = this.config.get('JWT_SECRET', 'yashil-quest-secret-2026');
    const encryptedPrivKey = this.blockchain.encryptWalletKey(wallet.privateKey, encryptionSecret);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        phone: dto.phone,
        passwordHash,
        walletAddress: wallet.address,
        walletPrivKey: encryptedPrivKey,
        region: dto.region,
        referredBy: dto.referralCode,
      },
    });

    this.logger.log(`New user registered: ${user.username}`);
    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username: email }] },
    });

    if (!user) {
      throw new UnauthorizedException('Email yoki parol noto\'g\'ri');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email yoki parol noto\'g\'ri');
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token yaroqsiz');
    }

    return this.generateTokens(stored.user);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Chiqildi' };
  }

  private getAdminUserIds(): Set<string> {
    const raw = this.config.get<string>('ADMIN_USER_IDS', '');
    return new Set(
      raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    );
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, username: user.username };
    const isAdmin = this.getAdminUserIds().has(user.id);

    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET', 'yashil-refresh-secret-2026'),
      expiresIn: '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.upsert({
      where: { token: refreshToken },
      update: { expiresAt },
      create: { token: refreshToken, userId: user.id, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        level: user.level,
        xp: user.xp,
        totalTokens: user.totalTokens,
        walletAddress: user.walletAddress,
        region: user.region,
        avatarUrl: user.avatarUrl,
        isAdmin,
      },
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
