import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OllamaService } from '../../common/ollama/ollama.service';
import { BlockchainService } from '../../common/blockchain/blockchain.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { parseJson, serializeJson } from '../../common/utils/json-field';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private prisma: PrismaService,
    private ollama: OllamaService,
    private blockchain: BlockchainService,
    private config: ConfigService,
  ) {}

  private normalizeReport(report: any) {
    return {
      ...report,
      evidence: parseJson<any>(report.evidence, {}),
    };
  }

  async createFraudReport(userId: string, data: {
    treeLocationId: string;
    description: string;
    photos?: string[];
    gpsLat: number;
    gpsLng: number;
  }) {
    const tree = await this.prisma.treeLocation.findUnique({ where: { id: data.treeLocationId } });
    if (!tree) throw new NotFoundException('Daraxt topilmadi');

    // Generate AI report
    const reportNarrative = await this.ollama.generateFraudReport({
      location: `${tree.region}, ${tree.district}`,
      stateReported: tree.stateReportedCount,
      detected: tree.actualCount || 0,
      healthScore: 0,
      photos: data.photos || [],
      timestamp: new Date().toISOString(),
      blockchainHash: '...',
    });

    const severity = this.assessSeverity(tree.stateReportedCount, tree.actualCount || 0);

    const lastReport = await this.prisma.fraudReport.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const prevHash = lastReport?.blockchainHash || '0'.repeat(64);
    const record = this.blockchain.createRecord(
      'fraud_report', data.treeLocationId, 'report',
      { description: data.description, severity }, userId, prevHash,
    );

    const report = await this.prisma.fraudReport.create({
      data: {
        treeLocationId: data.treeLocationId,
        reportedBy: userId,
        evidence: serializeJson({
          description: data.description,
          photos: data.photos || [],
          aiReport: reportNarrative,
          gps: { lat: data.gpsLat, lng: data.gpsLng },
        }),
        severity,
        blockchainHash: record.thisHash,
      },
    });

    // Try to submit to E-Anticorruption (mock)
    await this.submitToAnticorruption(report, tree, reportNarrative);

    // Award tokens for reporting
    const lastToken = await this.prisma.greenToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const tokenPrevHash = lastToken?.blockchainHash || '0'.repeat(64);
    const tokenRecord = this.blockchain.createRecord(
      'token', userId, 'mint', { amount: 20, type: 'EARNED_FRAUD_REPORT' }, userId, tokenPrevHash,
    );
    await this.prisma.greenToken.create({
      data: {
        userId,
        amount: 20,
        transactionType: 'EARNED_FRAUD_REPORT',
        referenceId: report.id,
        blockchainHash: tokenRecord.thisHash,
        prevHash: tokenPrevHash,
      },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { totalTokens: { increment: 20 }, xp: { increment: 200 } },
    });

    return { report: this.normalizeReport(report), reportNarrative, tokensEarned: 20 };
  }

  private assessSeverity(stateReported: number, detected: number): string {
    if (detected === 0) return 'HIGH';
    const ratio = detected / stateReported;
    if (ratio < 0.3) return 'HIGH';
    if (ratio < 0.7) return 'MEDIUM';
    return 'LOW';
  }

  private async submitToAnticorruption(report: any, tree: any, narrative: string) {
    try {
      const url = this.config.get('ANTICORRUPTION_API_URL');
      if (!url) return;

      await axios.post(`${url}/submit`, {
        case_type: 'environmental_fraud',
        location: { lat: tree.lat, lng: tree.lng, region: tree.region },
        description: narrative,
        evidence_hash: report.blockchainHash,
        severity: report.severity,
        source: 'yashil-quest',
      }, { timeout: 5000 });

      await this.prisma.fraudReport.update({
        where: { id: report.id },
        data: { status: 'SUBMITTED', anticorruptionRef: `AC-${Date.now()}` },
      });
    } catch (err) {
      this.logger.warn(`E-Anticorruption API unavailable: ${err.message}`);
    }
  }

  async getReports(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.fraudReport.findMany({
        where,
        include: {
          treeLocation: true,
          reporter: { select: { username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.fraudReport.count({ where }),
    ]);

    return {
      items: items.map((item) => this.normalizeReport(item)),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getUserReports(userId: string) {
    const reports = await this.prisma.fraudReport.findMany({
      where: { reportedBy: userId },
      include: { treeLocation: true },
      orderBy: { createdAt: 'desc' },
    });

    return reports.map((report) => this.normalizeReport(report));
  }
}
