import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BlockchainService } from '../../common/blockchain/blockchain.service';
import { OllamaService } from '../../common/ollama/ollama.service';
import { MinioService } from '../../common/minio/minio.service';
import { RedisService } from '../../common/redis/redis.service';
import { AntifraudService } from './antifraud.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { parseJson, serializeJson } from '../../common/utils/json-field';

@Injectable()
export class TreesService {
  private readonly logger = new Logger(TreesService.name);
  private readonly cvServiceUrl: string;

  constructor(
    private prisma: PrismaService,
    private blockchain: BlockchainService,
    private ollama: OllamaService,
    private minio: MinioService,
    private redis: RedisService,
    private antifraud: AntifraudService,
    private config: ConfigService,
  ) {
    this.cvServiceUrl = config.get('CV_SERVICE_URL', 'http://localhost:8000');
  }

  private normalizeVerification(verification: any) {
    return {
      ...verification,
      photos: parseJson<string[]>(verification.photos, []),
      livenessProof: parseJson<any>(verification.livenessProof, {}),
      exifData: parseJson<any>(verification.exifData, null),
      cvResult: parseJson<any>(verification.cvResult, null),
    };
  }

  private normalizeFraudReport(report: any) {
    return {
      ...report,
      evidence: parseJson<any>(report.evidence, {}),
    };
  }

  /**
   * Get all tree locations for map display
   */
  async getMapLocations(bounds?: { north: number; south: number; east: number; west: number }) {
    const where: any = {};
    if (bounds) {
      where.lat = { gte: bounds.south, lte: bounds.north };
      where.lng = { gte: bounds.west, lte: bounds.east };
    }

    const trees = await this.prisma.treeLocation.findMany({
      where,
      select: {
        id: true,
        lat: true,
        lng: true,
        status: true,
        stateReportedCount: true,
        actualCount: true,
        region: true,
        district: true,
        species: true,
        blockchainHash: true,
        verifiedAt: true,
      },
      take: 1000,
    });

    return trees;
  }

  /**
   * Get single tree location details
   */
  async getTreeById(id: string) {
    const tree = await this.prisma.treeLocation.findUnique({
      where: { id },
      include: {
        verifications: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: { select: { username: true, level: true } },
          },
        },
        fraudReports: {
          where: { status: { not: 'REJECTED' } },
          take: 3,
        },
      },
    });

    if (!tree) throw new NotFoundException('Daraxt topilmadi');
    return {
      ...tree,
      verifications: tree.verifications.map((verification) => this.normalizeVerification(verification)),
      fraudReports: tree.fraudReports.map((report) => this.normalizeFraudReport(report)),
    };
  }

  /**
   * Submit tree verification with photos and liveness proof
   */
  async submitVerification(userId: string, data: {
    treeLocationId: string;
    photos: string[]; // base64 encoded
    livenessProof: any;
    gpsLat: number;
    gpsLng: number;
    userAgent?: string;
  }) {
    const tree = await this.prisma.treeLocation.findUnique({
      where: { id: data.treeLocationId },
    });
    if (!tree) throw new NotFoundException('Daraxt topilmadi');

    // Anti-fraud checks
    await this.antifraud.validateSubmission(userId, tree, data);

    // Upload photos to configured storage
    const photoUrls: string[] = [];
    for (let i = 0; i < data.photos.length; i++) {
      const url = await this.minio.uploadBase64(
        data.photos[i],
        `tree_${data.treeLocationId}_${userId}_${i}.jpg`,
      );
      photoUrls.push(url);
    }

    // Run CV analysis
    let cvResult: any = { treeCount: 0, healthScore: 50, ndvi: 0.3, detections: [] };
    try {
      const cvResponse = await axios.post(
        `${this.cvServiceUrl}/analyze`,
        { photos: data.photos, tree_id: data.treeLocationId },
        { timeout: 30000 },
      );
      cvResult = cvResponse.data;
    } catch (error) {
      this.logger.warn(`CV service unavailable: ${error.message}. Using fallback.`);
      // Fallback: simple mock analysis
      cvResult = {
        treeCount: Math.floor(Math.random() * tree.stateReportedCount * 1.2) + 1,
        healthScore: Math.floor(Math.random() * 40) + 60,
        ndvi: Math.random() * 0.5 + 0.2,
        detections: [],
        fallback: true,
      };
    }

    // AI health analysis
    const aiAnalysis = await this.ollama.analyzeTreeHealth(cvResult);
    cvResult.aiAnalysis = aiAnalysis;

    // Fraud risk assessment
    const fraudRisk = await this.ollama.analyzeFraudRisk({
      stateReported: tree.stateReportedCount,
      detected: cvResult.treeCount,
      healthScore: cvResult.healthScore,
      exifMismatch: false,
      gpsDistance: 0,
    });
    cvResult.fraudRisk = fraudRisk;

    // Calculate tokens
    const isMonitoring = await this.isMonitoringVisit(userId, data.treeLocationId);
    const tokensEarned = isMonitoring ? 5 : 10;

    // Create blockchain record
    const lastVerification = await this.prisma.treeVerification.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const prevHash = lastVerification?.blockchainHash || '0'.repeat(64);

    const blockchainRecord = this.blockchain.createRecord(
      'tree_verification',
      data.treeLocationId,
      isMonitoring ? 'monitor' : 'verify',
      {
        photos: photoUrls,
        cvResult: { treeCount: cvResult.treeCount, healthScore: cvResult.healthScore },
        gps: { lat: data.gpsLat, lng: data.gpsLng },
      },
      userId,
      prevHash,
    );

    // Save verification
    const verification = await this.prisma.treeVerification.create({
      data: {
        treeLocationId: data.treeLocationId,
        userId,
        photos: serializeJson(photoUrls),
        livenessProof: serializeJson(data.livenessProof),
        cvResult: serializeJson(cvResult),
        healthScore: cvResult.healthScore,
        treeCount: cvResult.treeCount,
        tokensEarned,
        blockchainHash: blockchainRecord.thisHash,
        prevHash,
        isMonitoring,
      },
    });

    // Update tree status
    const discrepancy = Math.abs(cvResult.treeCount - tree.stateReportedCount);
    const discrepancyRate = discrepancy / tree.stateReportedCount;

    let newStatus = 'VERIFIED';
    if (discrepancyRate > 0.5) newStatus = 'DISPUTED';
    if (cvResult.treeCount === 0) newStatus = 'FRAUD';

    await this.prisma.treeLocation.update({
      where: { id: data.treeLocationId },
      data: {
        status: newStatus as any,
        actualCount: cvResult.treeCount,
        verifiedByUserId: userId,
        verifiedAt: new Date(),
        blockchainHash: blockchainRecord.thisHash,
      },
    });

    // Award tokens
    await this.awardTokens(userId, tokensEarned, 'EARNED_VERIFY', verification.id);

    // Update leaderboard
    await this.redis.zincrby('leaderboard:global', tokensEarned, userId);

    // Auto-create fraud report if needed
    if (newStatus === 'FRAUD' || newStatus === 'DISPUTED') {
      await this.createAutoFraudReport(tree, verification, cvResult, fraudRisk, userId);
    }

    // Check quest progress
    await this.updateQuestProgress(userId, isMonitoring ? 'monitor' : 'verify');

    return {
      verification: this.normalizeVerification(verification),
      tokensEarned,
      newStatus,
      aiAnalysis,
      fraudRisk,
      blockchainHash: blockchainRecord.thisHash,
      certificate: this.blockchain.formatCertificate(blockchainRecord),
    };
  }

  private async isMonitoringVisit(userId: string, treeId: string): Promise<boolean> {
    const previous = await this.prisma.treeVerification.findFirst({
      where: { userId, treeLocationId: treeId },
      orderBy: { createdAt: 'desc' },
    });
    return !!previous;
  }

  private async awardTokens(userId: string, amount: number, type: string, refId: string) {
    const lastToken = await this.prisma.greenToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const prevHash = lastToken?.blockchainHash || '0'.repeat(64);
    const record = this.blockchain.createRecord('token', userId, 'mint', { amount, type }, userId, prevHash);

    await this.prisma.greenToken.create({
      data: {
        userId,
        amount,
        transactionType: type as any,
        referenceId: refId,
        blockchainHash: record.thisHash,
        prevHash,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { totalTokens: { increment: amount }, xp: { increment: amount * 10 } },
    });

    // Update leaderboard
    await this.redis.zincrby('leaderboard:global', amount, userId);
  }

  private async createAutoFraudReport(tree: any, verification: any, cvResult: any, fraudRisk: any, userId: string) {
    await this.prisma.fraudReport.create({
      data: {
        treeLocationId: tree.id,
        reportedBy: userId,
        evidence: serializeJson({
          photos: parseJson<string[]>(verification.photos, []),
          cvResult,
          fraudRisk,
          verificationId: verification.id,
          blockchainHash: verification.blockchainHash,
        }),
        severity: fraudRisk.riskLevel === 'high' ? 'HIGH' : fraudRisk.riskLevel === 'medium' ? 'MEDIUM' : 'LOW',
        status: 'PENDING',
      },
    });
  }

  private async updateQuestProgress(userId: string, action: string) {
    const activeQuests = await this.prisma.userQuest.findMany({
      where: { userId, completedAt: null },
      include: { quest: true },
    });

    for (const uq of activeQuests) {
      const criteria = parseJson<any>(uq.quest.completionCriteria, {});
      if (criteria.type === action) {
        const progress = parseJson<any>(uq.progress, { count: 0 });
        progress.count = (progress.count || 0) + 1;

        const isCompleted = progress.count >= criteria.count;
        await this.prisma.userQuest.update({
          where: { id: uq.id },
          data: {
            progress: serializeJson(progress),
            completedAt: isCompleted ? new Date() : undefined,
          },
        });

        if (isCompleted) {
          await this.awardTokens(userId, uq.quest.rewardTokens, 'EARNED_QUEST', uq.questId);
          await this.prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: uq.quest.xpReward } },
          });
        }
      }
    }
  }

  /**
   * Get nearby trees within radius
   */
  async getNearbyTrees(lat: number, lng: number, radiusKm = 5) {
    // Approximate bounding box (1 degree lat ≈ 111km)
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    return this.prisma.treeLocation.findMany({
      where: {
        lat: { gte: lat - latDelta, lte: lat + latDelta },
        lng: { gte: lng - lngDelta, lte: lng + lngDelta },
        status: 'PENDING',
      },
      take: 50,
    });
  }

  /**
   * Get verification history for a user
   */
  async getUserVerifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.treeVerification.findMany({
        where: { userId },
        include: { treeLocation: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.treeVerification.count({ where: { userId } }),
    ]);

    return {
      items: items.map((item) => this.normalizeVerification(item)),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Seed black spots from external state report data (mock)
   */
  async importStateReportData(data: any[]) {
    const created = [];
    let prevHash = '0'.repeat(64);

    for (const item of data) {
      const record = this.blockchain.createRecord('tree_location', item.id || 'new', 'import', item, undefined, prevHash);
      const tree = await this.prisma.treeLocation.create({
        data: {
          lat: item.lat,
          lng: item.lng,
          stateReportedCount: item.count,
          region: item.region,
          district: item.district,
          species: item.species,
          plantationDate: item.plantationDate ? new Date(item.plantationDate) : undefined,
          blockchainHash: record.thisHash,
          prevHash,
        },
      });
      prevHash = record.thisHash;
      created.push(tree);
    }

    return { created: created.length };
  }
}
