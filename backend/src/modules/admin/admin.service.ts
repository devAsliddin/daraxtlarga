import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OllamaService } from '../../common/ollama/ollama.service';
import { BlockchainService } from '../../common/blockchain/blockchain.service';
import { parseJson } from '../../common/utils/json-field';
import { CreateTreeLocationDto } from './dto/create-tree-location.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private ollama: OllamaService,
    private blockchain: BlockchainService,
  ) {}

  private normalizeVerification(verification: any) {
    return {
      ...verification,
      photos: parseJson<string[]>(verification.photos, []),
      livenessProof: parseJson<any>(verification.livenessProof, {}),
      exifData: parseJson<any>(verification.exifData, null),
      cvResult: parseJson<any>(verification.cvResult, null),
    };
  }

  private normalizeReport(report: any) {
    return {
      ...report,
      evidence: parseJson<any>(report.evidence, {}),
    };
  }

  async getDashboardStats() {
    const [users, trees, verifications, reports, tokens, recentTreeLocations] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.treeLocation.count(),
      this.prisma.treeVerification.count(),
      this.prisma.fraudReport.count({ where: { status: 'PENDING' } }),
      this.prisma.user.aggregate({ _sum: { totalTokens: true } }),
      this.prisma.treeLocation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          region: true,
          district: true,
          species: true,
          status: true,
          stateReportedCount: true,
          lat: true,
          lng: true,
          createdAt: true,
        },
      }),
    ]);

    const treesByStatus = await this.prisma.treeLocation.groupBy({
      by: ['status'],
      _count: true,
    });

    const recentActivity = await this.prisma.treeVerification.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } },
        treeLocation: { select: { region: true, district: true } },
      },
    });

    return {
      overview: {
        totalUsers: users,
        totalTrees: trees,
        totalVerifications: verifications,
        pendingReports: reports,
        totalTokens: tokens._sum.totalTokens || 0,
      },
      treesByStatus: treesByStatus.reduce((acc, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {} as Record<string, number>),
      recentActivity: recentActivity.map((item) => this.normalizeVerification(item)),
      recentTreeLocations,
    };
  }

  async getPendingReports(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.fraudReport.findMany({
        where: { status: 'PENDING' },
        include: {
          treeLocation: true,
          reporter: { select: { username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.fraudReport.count({ where: { status: 'PENDING' } }),
    ]);
    return { items: items.map((item) => this.normalizeReport(item)), total };
  }

  async reviewReport(reportId: string, adminId: string, action: 'CONFIRMED' | 'REJECTED', notes?: string) {
    return this.prisma.fraudReport.update({
      where: { id: reportId },
      data: { status: action, adminNotes: notes },
    });
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, username: true, level: true,
          totalTokens: true, region: true, createdAt: true,
          _count: { select: { verifications: true, fraudReports: true } },
        },
      }),
      this.prisma.user.count(),
    ]);
    return { items, total };
  }

  async generateRegionReport(region: string) {
    const [trees, verifications, fraudReports] = await Promise.all([
      this.prisma.treeLocation.count({ where: { region } }),
      this.prisma.treeVerification.count({ where: { treeLocation: { region } } }),
      this.prisma.fraudReport.count({ where: { treeLocation: { region } } }),
    ]);

    const treesByStatus = await this.prisma.treeLocation.groupBy({
      by: ['status'],
      where: { region },
      _count: true,
      _sum: { stateReportedCount: true, actualCount: true },
    });

    const aiSummary = await this.ollama.generate(
      `${region} viloyati uchun "Yashil Makon" monitoringi hisobotini yarating:\n` +
      `- Jami daraxt joylashuvi: ${trees}\n` +
      `- Tekshiruvlar: ${verifications}\n` +
      `- Firibgarlik hisobotlari: ${fraudReports}\n` +
      `- Holat bo'yicha: ${JSON.stringify(treesByStatus)}\n\n` +
      'Qisqacha (1 xat hajmida) rasmiy hisobot tuzing.',
      'Siz ekologiya monitoringi bo\'yicha mutaxassississiz.',
    );

    return { region, trees, verifications, fraudReports, treesByStatus, aiSummary };
  }

  async getOllamaStatus() {
    const available = await this.ollama.isAvailable();
    const models = available ? await this.ollama.listModels() : [];
    return { available, models };
  }

  async createTreeLocation(adminId: string, data: CreateTreeLocationDto) {
    return this.prisma.$transaction(async (tx) => {
      const lastTree = await tx.treeLocation.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { blockchainHash: true },
      });

      const prevHash = lastTree?.blockchainHash || '0'.repeat(64);

      const created = await tx.treeLocation.create({
        data: {
          lat: data.lat,
          lng: data.lng,
          stateReportedCount: data.stateReportedCount,
          region: data.region,
          district: data.district,
          species: data.species,
          plantationDate: data.plantationDate ? new Date(data.plantationDate) : undefined,
          status: data.status || 'PENDING',
        },
      });

      const record = this.blockchain.createRecord(
        'tree_location',
        created.id,
        'admin_create',
        {
          lat: created.lat,
          lng: created.lng,
          stateReportedCount: created.stateReportedCount,
          region: created.region,
          district: created.district,
          species: created.species,
          plantationDate: created.plantationDate,
          status: created.status,
        },
        adminId,
        prevHash,
      );

      return tx.treeLocation.update({
        where: { id: created.id },
        data: {
          blockchainHash: record.thisHash,
          prevHash,
        },
      });
    });
  }
}
