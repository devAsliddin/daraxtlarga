import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TokensService {
  constructor(private prisma: PrismaService) {}

  async getUserBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totalTokens: true, walletAddress: true },
    });
    return user;
  }

  async getTransactionHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.greenToken.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.greenToken.count({ where: { userId } }),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async getTokenSupplyStats() {
    const stats = await this.prisma.greenToken.groupBy({
      by: ['transactionType'],
      _sum: { amount: true },
      _count: true,
    });

    const totalSupply = await this.prisma.user.aggregate({
      _sum: { totalTokens: true },
    });

    return {
      totalSupply: totalSupply._sum.totalTokens || 0,
      byType: stats.map(s => ({
        type: s.transactionType,
        total: s._sum.amount,
        count: s._count,
      })),
    };
  }

  async verifyBlockchainIntegrity(userId: string) {
    const txs = await this.prisma.greenToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const issues = [];
    let prevHash = '0'.repeat(64);

    for (const tx of txs) {
      if (tx.prevHash !== prevHash) {
        issues.push(`Transaction ${tx.id}: chain broken`);
      }
      prevHash = tx.blockchainHash || prevHash;
    }

    return {
      valid: issues.length === 0,
      transactionsChecked: txs.length,
      issues,
    };
  }
}
