import { Test, TestingModule } from '@nestjs/testing';
import { AntifraudService } from '../antifraud.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { BadRequestException } from '@nestjs/common';

const mockPrisma = {
  treeVerification: {
    findFirst: jest.fn(),
  },
};

const mockRedis = {
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(undefined),
};

describe('AntifraudService', () => {
  let service: AntifraudService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AntifraudService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AntifraudService>(AntifraudService);
    jest.clearAllMocks();
  });

  describe('haversineDistance()', () => {
    it('should return 0 for same coordinates', () => {
      const dist = service.haversineDistance(41.2995, 69.2401, 41.2995, 69.2401);
      expect(dist).toBe(0);
    });

    it('should return correct distance between Tashkent landmarks', () => {
      // Chorsu Bazaar to Alisher Navoi Opera - ~2km
      const dist = service.haversineDistance(41.2974, 69.2323, 41.2950, 69.2721);
      expect(dist).toBeGreaterThan(2500);
      expect(dist).toBeLessThan(4000);
    });

    it('should handle antipodal points', () => {
      const dist = service.haversineDistance(0, 0, 0, 180);
      expect(dist).toBeCloseTo(20015086, -5); // Half Earth circumference
    });
  });

  describe('validateLiveness()', () => {
    it('should pass with completed=true proof', () => {
      expect(() => service['validateLiveness']({ completed: true })).not.toThrow();
    });

    it('should pass with challenges array', () => {
      expect(() => service['validateLiveness']({
        challenges: ['blink', 'turn-left', 'smile'],
      })).not.toThrow();
    });

    it('should pass with verified=true', () => {
      expect(() => service['validateLiveness']({ verified: true })).not.toThrow();
    });

    it('should throw BadRequestException with null proof', () => {
      expect(() => service['validateLiveness'](null))
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException with incomplete proof', () => {
      expect(() => service['validateLiveness']({ completed: false }))
        .toThrow(BadRequestException);
    });
  });

  describe('validateGPS()', () => {
    const treeLat = 41.2995;
    const treeLng = 69.2401;

    it('should pass when user is within 100m', () => {
      // Offset by ~10m (0.0001 degrees)
      expect(() => service['validateGPS'](treeLat, treeLng, treeLat + 0.00005, treeLng + 0.00005))
        .not.toThrow();
    });

    it('should throw when user is too far', () => {
      // 1km away
      expect(() => service['validateGPS'](treeLat, treeLng, treeLat + 0.01, treeLng + 0.01))
        .toThrow(BadRequestException);
    });
  });

  describe('validateExif()', () => {
    it('should pass without EXIF data', () => {
      const result = service.validateExif(null, 41.3, 69.2);
      expect(result.valid).toBe(true);
    });

    it('should flag GPS mismatch in EXIF', () => {
      const result = service.validateExif(
        { gps: { lat: 40.0, lng: 68.0 } }, // 200km+ away
        41.3, 69.2,
      );
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('EXIF GPS');
    });

    it('should flag timestamp mismatch', () => {
      const oldTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      const result = service.validateExif({ timestamp: oldTime }, 41.3, 69.2);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('checkRateLimit()', () => {
    it('should pass within daily limit', async () => {
      mockRedis.incr.mockResolvedValue(5);
      await expect(service['checkRateLimit']('user-1')).resolves.not.toThrow();
    });

    it('should throw when daily limit exceeded', async () => {
      mockRedis.incr.mockResolvedValue(11);
      await expect(service['checkRateLimit']('user-2')).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateSubmission() integration', () => {
    const mockTree = {
      id: 'tree-1',
      lat: 41.2995,
      lng: 69.2401,
      stateReportedCount: 50,
    };

    it('should pass complete valid submission', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockPrisma.treeVerification.findFirst.mockResolvedValue(null);

      await expect(service.validateSubmission('user-1', mockTree, {
        livenessProof: { completed: true },
        gpsLat: 41.2995,
        gpsLng: 69.2401,
        photos: ['base64photo'],
      })).resolves.not.toThrow();
    });

    it('should reject with no photos', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockPrisma.treeVerification.findFirst.mockResolvedValue(null);

      await expect(service.validateSubmission('user-1', mockTree, {
        livenessProof: { completed: true },
        gpsLat: 41.2995,
        gpsLng: 69.2401,
        photos: [],
      })).rejects.toThrow(BadRequestException);
    });
  });
});
