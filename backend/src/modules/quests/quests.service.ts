import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { parseJson, serializeJson } from '../../common/utils/json-field';

@Injectable()
export class QuestsService {
  constructor(private prisma: PrismaService) {}

  private normalizeBadge(badge: any) {
    return {
      ...badge,
      unlockCriteria: parseJson<any>(badge.unlockCriteria, {}),
    };
  }

  private normalizeUserQuest(userQuest: any) {
    if (!userQuest) {
      return userQuest;
    }

    return {
      ...userQuest,
      progress: parseJson<any>(userQuest.progress, {}),
    };
  }

  private normalizeQuest(quest: any) {
    return {
      ...quest,
      completionCriteria: parseJson<any>(quest.completionCriteria, {}),
    };
  }

  async getActiveQuests(userId: string) {
    const now = new Date();
    const quests = await this.prisma.quest.findMany({
      where: {
        activeFrom: { lte: now },
        activeUntil: { gte: now },
      },
    });

    const userQuestMap = new Map<string, any>();
    const userQuests = await this.prisma.userQuest.findMany({
      where: { userId, questId: { in: quests.map(q => q.id) } },
    });
    userQuests.forEach(uq => userQuestMap.set(uq.questId, uq));

    // Auto-enroll user in active quests
    for (const quest of quests) {
      if (!userQuestMap.has(quest.id)) {
        const uq = await this.prisma.userQuest.create({
          data: { userId, questId: quest.id, progress: serializeJson({}) },
        });
        userQuestMap.set(quest.id, uq);
      }
    }

    return quests.map((quest) => ({
      ...this.normalizeQuest(quest),
      userProgress: this.normalizeUserQuest(userQuestMap.get(quest.id)),
    }));
  }

  async getUserBadges(userId: string) {
    const badges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    return badges.map((entry) => ({
      ...entry,
      badge: this.normalizeBadge(entry.badge),
    }));
  }

  async getAllBadges() {
    const badges = await this.prisma.badge.findMany({
      orderBy: { rarity: 'asc' },
    });

    return badges.map((badge) => this.normalizeBadge(badge));
  }

  async checkAndAwardBadges(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userBadges: true, verifications: true, fraudReports: true },
    });

    const allBadges = await this.prisma.badge.findMany();
    const earnedBadgeIds = new Set(user.userBadges.map(ub => ub.badgeId));
    const newBadges = [];

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const criteria = parseJson<any>(badge.unlockCriteria, {});
      let earned = false;

      if (criteria.verifications !== undefined && user.verifications.length >= criteria.verifications) {
        earned = true;
      } else if (criteria.tokens !== undefined && user.totalTokens >= criteria.tokens) {
        earned = true;
      } else if (criteria.fraudReports !== undefined && user.fraudReports.length >= criteria.fraudReports) {
        earned = true;
      }

      if (earned) {
        await this.prisma.userBadge.create({
          data: { userId, badgeId: badge.id },
        });
        newBadges.push(this.normalizeBadge(badge));
      }
    }

    return newBadges;
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        level: true,
        xp: true,
        totalTokens: true,
        region: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            verifications: true,
            fraudReports: true,
          },
        },
        userBadges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
      },
    });

    if (!user) return null;

    const { _count, userBadges, ...userFields } = user;
    const nextLevelXp = user.level * 500;
    const xpProgress = (user.xp % nextLevelXp) / nextLevelXp * 100;

    return {
      ...userFields,
      nextLevelXp,
      xpProgress,
      userBadges: userBadges.map((entry) => ({
        ...entry,
        badge: this.normalizeBadge(entry.badge),
      })),
      stats: {
        verifications: _count.verifications,
        fraudReports: _count.fraudReports,
        badges: userBadges.length,
      },
    };
  }
}
