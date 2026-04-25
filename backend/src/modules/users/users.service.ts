import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private getAdminUserIds(): Set<string> {
    const raw = this.config.get<string>('ADMIN_USER_IDS', '');
    return new Set(
      raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    );
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, username: true, phone: true,
        level: true, xp: true, totalTokens: true, region: true,
        avatarUrl: true, walletAddress: true, createdAt: true,
        _count: { select: { verifications: true, fraudReports: true } },
      },
    });

    if (!profile) {
      return null;
    }

    return {
      ...profile,
      isAdmin: this.getAdminUserIds().has(profile.id),
    };
  }

  async updateProfile(userId: string, data: { region?: string; phone?: string; avatarUrl?: string }) {
    const profile = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, region: true, phone: true, avatarUrl: true },
    });

    return {
      ...profile,
      isAdmin: this.getAdminUserIds().has(profile.id),
    };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, username: true, level: true,
          totalTokens: true, region: true, createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);
    return { items, total };
  }
}
