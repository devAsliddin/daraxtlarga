import { Test, TestingModule } from '@nestjs/testing';
import { QuestsService } from '../quests.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

// Regression: ISSUE-003 — getUserProfile spread Prisma's internal _count field into API response
// Found by /qa on 2026-04-25
// Report: .gstack/qa-reports/qa-report-yashil-quest-2026-04-25.md

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  userBadge: {
    findMany: jest.fn(),
  },
  badge: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  userQuest: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  quest: {
    findMany: jest.fn(),
  },
};

describe('QuestsService', () => {
  let service: QuestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<QuestsService>(QuestsService);
    jest.clearAllMocks();
  });

  describe('getUserProfile()', () => {
    it('does NOT expose _count in the response', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        username: 'TestUser',
        level: 3,
        xp: 800,
        totalTokens: 150,
        region: 'Toshkent',
        avatarUrl: null,
        createdAt: new Date(),
        _count: { verifications: 10, fraudReports: 2 },
        userBadges: [
          {
            earnedAt: new Date(),
            badge: { id: 'b1', name: 'EcoHero', rarity: 'COMMON', unlockCriteria: '{"verifications":5}' },
          },
        ],
      });

      const result = await service.getUserProfile('user-1');

      // _count must NOT appear in the API response
      expect(result).not.toHaveProperty('_count');

      // But the data from _count should appear under 'stats'
      expect(result.stats).toEqual({
        verifications: 10,
        fraudReports: 2,
        badges: 1,
      });
    });

    it('computes XP progress correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        username: 'TestUser',
        level: 2,
        xp: 250, // 250 / (2 * 500) = 25%
        totalTokens: 0,
        region: null,
        avatarUrl: null,
        createdAt: new Date(),
        _count: { verifications: 0, fraudReports: 0 },
        userBadges: [],
      });

      const result = await service.getUserProfile('user-1');
      expect(result.nextLevelXp).toBe(1000); // level 2 * 500
      expect(result.xpProgress).toBe(25); // 250/1000 * 100
    });

    it('returns null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.getUserProfile('nonexistent');
      expect(result).toBeNull();
    });

    it('normalizes badge unlockCriteria JSON string', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        username: 'u',
        level: 1,
        xp: 0,
        totalTokens: 0,
        region: null,
        avatarUrl: null,
        createdAt: new Date(),
        _count: { verifications: 0, fraudReports: 0 },
        userBadges: [
          {
            earnedAt: new Date(),
            badge: { id: 'b1', name: 'Tree Guardian', rarity: 'RARE', unlockCriteria: '{"verifications":100}' },
          },
        ],
      });

      const result = await service.getUserProfile('user-1');
      expect(result.userBadges[0].badge.unlockCriteria).toEqual({ verifications: 100 });
    });
  });
});
