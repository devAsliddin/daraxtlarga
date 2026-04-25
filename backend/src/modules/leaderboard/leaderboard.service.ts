import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getGlobalLeaderboard(limit = 50) {
    const entries = await this.redis.zrevrange('leaderboard:global', 0, limit - 1, true);

    if (!entries || entries.length === 0) {
      return this.getLeaderboardFromDb(limit);
    }

    // Collect all user IDs and scores in one pass
    const userIds: string[] = [];
    const scoreMap = new Map<string, number>();
    for (let i = 0; i < entries.length; i += 2) {
      const userId = entries[i];
      const score = parseFloat(entries[i + 1]);
      userIds.push(userId);
      scoreMap.set(userId, score);
    }

    // Single batch query instead of N+1
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, level: true, region: true, avatarUrl: true, totalTokens: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const leaderboard = [];
    let rank = 1;
    for (const userId of userIds) {
      const user = userMap.get(userId);
      if (user) {
        leaderboard.push({
          rank: rank++,
          userId,
          username: user.username,
          level: user.level,
          region: user.region,
          avatarUrl: user.avatarUrl,
          tokens: user.totalTokens,
          score: scoreMap.get(userId) ?? 0,
        });
      }
    }

    if (leaderboard.length === 0) {
      return this.getLeaderboardFromDb(limit);
    }

    return leaderboard;
  }

  private async getLeaderboardFromDb(limit: number) {
    const users = await this.prisma.user.findMany({
      orderBy: { totalTokens: 'desc' },
      take: limit,
      select: {
        id: true,
        username: true,
        level: true,
        region: true,
        avatarUrl: true,
        totalTokens: true,
      },
    });

    return users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      username: u.username,
      level: u.level,
      region: u.region,
      avatarUrl: u.avatarUrl,
      tokens: u.totalTokens,
      score: u.totalTokens,
    }));
  }

  async getRegionalLeaderboard(region: string, limit = 20) {
    const users = await this.prisma.user.findMany({
      where: { region },
      orderBy: { totalTokens: 'desc' },
      take: limit,
      select: {
        id: true,
        username: true,
        level: true,
        totalTokens: true,
        avatarUrl: true,
      },
    });

    return users.map((u, i) => ({ rank: i + 1, ...u }));
  }

  async getUserRank(userId: string) {
    const rank = await this.redis.zrank('leaderboard:global', userId);
    const score = await this.redis.zscore('leaderboard:global', userId);
    const total = await this.prisma.user.count();

    return {
      rank: rank !== null ? rank + 1 : null,
      score: score ? parseFloat(score) : 0,
      totalParticipants: total,
    };
  }

  async getStats() {
    const [totalUsers, totalTrees, totalVerifications, totalTokens] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.treeLocation.count(),
      this.prisma.treeVerification.count(),
      this.prisma.user.aggregate({ _sum: { totalTokens: true } }),
    ]);

    const byStatus = await this.prisma.treeLocation.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      totalUsers,
      totalTrees,
      totalVerifications,
      totalTokensCirculation: totalTokens._sum.totalTokens || 0,
      treesByStatus: byStatus.reduce((acc, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async syncLeaderboardFromDb() {
    const users = await this.prisma.user.findMany({
      select: { id: true, totalTokens: true },
    });
    for (const user of users) {
      await this.redis.zadd('leaderboard:global', user.totalTokens, user.id);
    }
    this.logger.log(`Synced ${users.length} users to leaderboard`);
  }
}
