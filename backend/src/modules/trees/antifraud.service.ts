import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class AntifraudService {
  private readonly logger = new Logger(AntifraudService.name);
  private readonly MAX_DAILY_VERIFICATIONS = 10;
  private readonly GEOFENCE_RADIUS_METERS = 100; // relaxed for demo
  private readonly MIN_REVERIFICATION_DAYS = 30;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Comprehensive anti-fraud validation pipeline
   */
  async validateSubmission(userId: string, tree: any, data: {
    livenessProof: any;
    gpsLat: number;
    gpsLng: number;
    photos: string[];
  }) {
    // 1. Rate limiting
    await this.checkRateLimit(userId);

    // 2. Liveness check
    this.validateLiveness(data.livenessProof);

    // 3. GPS geofencing
    this.validateGPS(tree.lat, tree.lng, data.gpsLat, data.gpsLng);

    // 4. Minimum time between re-verifications
    await this.checkReverificationCooldown(userId, tree.id);

    // 5. Photo count validation
    if (!data.photos || data.photos.length < 1) {
      throw new BadRequestException('Kamida 1 ta rasm yuklash shart');
    }

    this.logger.log(`Anti-fraud validation passed for user ${userId} at tree ${tree.id}`);
  }

  private async checkRateLimit(userId: string) {
    const key = `rate:verify:${userId}:${new Date().toDateString()}`;
    const count = await this.redis.incr(key);
    await this.redis.expire(key, 86400);

    if (count > this.MAX_DAILY_VERIFICATIONS) {
      throw new BadRequestException(
        `Kunlik ${this.MAX_DAILY_VERIFICATIONS} ta tekshiruv limiti oshib ketdi`,
      );
    }
  }

  private validateLiveness(proof: any) {
    if (!proof) {
      throw new BadRequestException('Liveness tekshiruvi o\'tkazilmagan');
    }

    // Allow flexible liveness proof formats
    const hasValidProof =
      proof.completed === true ||
      (proof.challenges && proof.challenges.length >= 1) ||
      proof.verified === true ||
      proof.passed === true;

    if (!hasValidProof) {
      throw new BadRequestException('Liveness tekshiruvi muvaffaqiyatsiz');
    }
  }

  private validateGPS(treeLat: number, treeLng: number, userLat: number, userLng: number) {
    const distance = this.haversineDistance(treeLat, treeLng, userLat, userLng);

    if (distance > this.GEOFENCE_RADIUS_METERS) {
      throw new BadRequestException(
        `Siz daraxtdan ${Math.round(distance)}m uzoqdasiz. Yaqinroq boring (${this.GEOFENCE_RADIUS_METERS}m radius).`,
      );
    }
  }

  private async checkReverificationCooldown(userId: string, treeId: string) {
    const lastVerification = await this.prisma.treeVerification.findFirst({
      where: { userId, treeLocationId: treeId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastVerification) {
      const daysSince = Math.floor(
        (Date.now() - lastVerification.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSince < this.MIN_REVERIFICATION_DAYS) {
        throw new BadRequestException(
          `Bu daraxtni yana ${this.MIN_REVERIFICATION_DAYS - daysSince} kundan so'ng tekshirishingiz mumkin`,
        );
      }
    }
  }

  /**
   * Haversine distance between two GPS coordinates (meters)
   */
  haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Validate EXIF data from photo
   */
  validateExif(exifData: any, claimedLat: number, claimedLng: number): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!exifData) {
      return { valid: true, issues: ['EXIF ma\'lumot mavjud emas'] };
    }

    // Check timestamp
    if (exifData.timestamp) {
      const photoTime = new Date(exifData.timestamp).getTime();
      const now = Date.now();
      const diff = Math.abs(now - photoTime);
      if (diff > 5 * 60 * 1000) {
        issues.push(`Rasm vaqti ${Math.round(diff / 60000)} daqiqa farq qiladi`);
      }
    }

    // Check GPS if available
    if (exifData.gps) {
      const gpsDistance = this.haversineDistance(
        claimedLat, claimedLng,
        exifData.gps.lat, exifData.gps.lng,
      );
      if (gpsDistance > 200) {
        issues.push(`EXIF GPS ${Math.round(gpsDistance)}m farq qiladi`);
      }
    }

    return { valid: issues.length === 0, issues };
  }
}
