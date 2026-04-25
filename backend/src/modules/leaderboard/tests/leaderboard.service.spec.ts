import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from '../leaderboard.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';

// Regression: ISSUE-004 — N+1 query in getGlobalLeaderboard; was making one DB call per user in Redis
// Found by /qa on 2026-04-25
// Report: .gstack/qa-reports/qa-report-yashil-quest-2026-04-25.md

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  treeLocation: {
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  treeVerification: {
    count: jest.fn(),
  },
};

const mockRedis = {
  zrevrange: jest.fn(),
  zrank: jest.fn(),
  zscore: jest.fn(),
  zadd: jest.fn(),
};

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    jest.clearAllMocks();
  });

  describe('getGlobalLeaderboard()', () => {
    it('makes a single batch DB query (not N+1) when Redis has entries', async () => {
      // Redis returns 3 users with scores
      mockRedis.zrevrange.mockResolvedValue(['user-1', '300', 'user-2', '200', 'user-3', '100']);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', username: 'Alice', level: 5, region: 'Toshkent', avatarUrl: null, totalTokens: 300 },
        { id: 'user-2', username: 'Bob', level: 3, region: 'Samarqand', avatarUrl: null, totalTokens: 200 },
        { id: 'user-3', username: 'Carol', level: 2, region: 'Buxoro', avatarUrl: null, totalTokens: 100 },
      ]);

      const result = await service.getGlobalLeaderboard(50);

      // Critical: findMany called exactly once, not once per user
      expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: { in: ['user-1', 'user-2', 'user-3'] } } }),
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ rank: 1, userId: 'user-1', score: 300 });
      expect(result[1]).toMatchObject({ rank: 2, userId: 'user-2', score: 200 });
      expect(result[2]).toMatchObject({ rank: 3, userId: 'user-3', score: 100 });
    });

    it('falls back to DB when Redis is empty', async () => {
      mockRedis.zrevrange.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', username: 'Alice', level: 5, region: 'Toshkent', avatarUrl: null, totalTokens: 300 },
      ]);

      const result = await service.getGlobalLeaderboard(50);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ rank: 1, userId: 'user-1', tokens: 300 });
    });

    it('falls back to DB when Redis returns null', async () => {
      mockRedis.zrevrange.mockResolvedValue(null);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.getGlobalLeaderboard(10);
      expect(result).toEqual([]);
    });

    it('skips deleted users (in Redis but not in DB)', async () => {
      mockRedis.zrevrange.mockResolvedValue(['user-deleted', '999', 'user-1', '100']);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', username: 'Alice', level: 1, region: null, avatarUrl: null, totalTokens: 100 },
      ]);

      const result = await service.getGlobalLeaderboard(50);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
    });
  });

  describe('getUserRank()', () => {
    it('returns rank and score for a user in Redis', async () => {
      mockRedis.zrank.mockResolvedValue(2); // 0-indexed → rank 3
      mockRedis.zscore.mockResolvedValue('150');
      mockPrisma.user.count.mockResolvedValue(10);

      const result = await service.getUserRank('user-1');
      expect(result.rank).toBe(3);
      expect(result.score).toBe(150);
      expect(result.totalParticipants).toBe(10);
    });

    it('returns null rank when user is not in Redis', async () => {
      mockRedis.zrank.mockResolvedValue(null);
      mockRedis.zscore.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(5);

      const result = await service.getUserRank('unknown-user');
      expect(result.rank).toBeNull();
      expect(result.score).toBe(0);
    });
  });
});
