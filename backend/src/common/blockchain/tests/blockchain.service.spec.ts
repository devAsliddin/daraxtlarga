import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from '../blockchain.service';

describe('BlockchainService', () => {
  let service: BlockchainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainService],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
  });

  describe('hash()', () => {
    it('should produce consistent SHA-256 hashes', () => {
      const input = 'test data';
      const hash1 = service.hash(input);
      const hash2 = service.hash(input);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = service.hash('data1');
      const hash2 = service.hash('data2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createRecord()', () => {
    it('should create a valid blockchain record', () => {
      const prevHash = '0'.repeat(64);
      const record = service.createRecord(
        'tree_verification',
        'tree-123',
        'verify',
        { treeCount: 5, healthScore: 80 },
        'user-456',
        prevHash,
      );

      expect(record.entityType).toBe('tree_verification');
      expect(record.entityId).toBe('tree-123');
      expect(record.action).toBe('verify');
      expect(record.prevHash).toBe(prevHash);
      expect(record.thisHash).toHaveLength(64);
      expect(record.version).toBe(1);
      expect(record.timestamp).toBeTruthy();
    });

    it('should include user ID in record', () => {
      const record = service.createRecord(
        'token', 'token-123', 'mint', { amount: 10 }, 'user-789', '0'.repeat(64),
      );
      expect(record.userId).toBe('user-789');
    });
  });

  describe('verifyRecord()', () => {
    it('should verify a valid record chain', () => {
      const prevHash = '0'.repeat(64);
      const record = service.createRecord(
        'tree', 'id1', 'verify', {}, 'user1', prevHash,
      );
      const isValid = service.verifyRecord(record, prevHash);
      expect(isValid).toBe(true);
    });

    it('should reject tampered record', () => {
      const prevHash = '0'.repeat(64);
      const record = service.createRecord(
        'tree', 'id1', 'verify', {}, 'user1', prevHash,
      );
      // Tamper with data
      const tampered = { ...record, data: { hacked: true } };
      const isValid = service.verifyRecord(tampered, prevHash);
      expect(isValid).toBe(false);
    });

    it('should reject broken chain', () => {
      const prevHash = '0'.repeat(64);
      const record = service.createRecord(
        'tree', 'id1', 'verify', {}, 'user1', prevHash,
      );
      // Provide wrong prevHash
      const isValid = service.verifyRecord(record, 'a'.repeat(64));
      expect(isValid).toBe(false);
    });
  });

  describe('generateWallet()', () => {
    it('should generate unique wallet with YQ prefix', () => {
      const wallet1 = service.generateWallet();
      const wallet2 = service.generateWallet();

      expect(wallet1.address).toMatch(/^YQ/);
      expect(wallet2.address).toMatch(/^YQ/);
      expect(wallet1.address).not.toBe(wallet2.address);
      expect(wallet1.publicKey).toContain('PUBLIC KEY');
      expect(wallet1.privateKey).toContain('PRIVATE KEY');
    });
  });

  describe('hashVerification()', () => {
    it('should produce deterministic hash for same inputs', () => {
      const photos = ['url1', 'url2'];
      const hash1 = service.hashVerification('tree1', 'user1', photos, 41.3, 69.2, {}, '0'.repeat(64));
      const hash2 = service.hashVerification('tree1', 'user1', photos, 41.3, 69.2, {}, '0'.repeat(64));
      expect(hash1).toBe(hash2);
    });

    it('should produce different hash with different prevHash', () => {
      const hash1 = service.hashVerification('tree1', 'user1', [], 41.3, 69.2, {}, '0'.repeat(64));
      const hash2 = service.hashVerification('tree1', 'user1', [], 41.3, 69.2, {}, 'a'.repeat(64));
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('formatCertificate()', () => {
    it('should format a human-readable certificate', () => {
      const record = service.createRecord('tree', 'id1', 'verify', {}, 'user1', '0'.repeat(64));
      const cert = service.formatCertificate(record);
      expect(cert).toContain('YASHIL QUEST BLOCKCHAIN CERTIFICATE');
      expect(cert).toContain('tree');
      expect(cert).toContain('verify');
    });
  });

  // Regression: ISSUE-001b — walletPrivKey was stored as plaintext PEM despite schema comment saying "encrypted"
  // Found by /qa on 2026-04-25
  describe('encryptWalletKey() / decryptWalletKey()', () => {
    const secret = 'test-secret-key-min-32-chars-long!!';
    const plaintext = '-----BEGIN PRIVATE KEY-----\nMockPrivateKeyContent\n-----END PRIVATE KEY-----\n';

    it('encrypts a private key to iv:authTag:ciphertext format', () => {
      const encrypted = service.encryptWalletKey(plaintext, secret);
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(32); // 16 bytes hex = 32 chars
      expect(parts[1]).toHaveLength(32); // 16 bytes auth tag hex
      expect(encrypted).not.toContain('BEGIN PRIVATE KEY');
    });

    it('decrypts back to the original plaintext', () => {
      const encrypted = service.encryptWalletKey(plaintext, secret);
      const decrypted = service.decryptWalletKey(encrypted, secret);
      expect(decrypted).toBe(plaintext);
    });

    it('produces different ciphertext on each call (random IV)', () => {
      const enc1 = service.encryptWalletKey(plaintext, secret);
      const enc2 = service.encryptWalletKey(plaintext, secret);
      expect(enc1).not.toBe(enc2);
    });

    it('throws when decrypting with wrong secret (auth tag mismatch)', () => {
      const encrypted = service.encryptWalletKey(plaintext, secret);
      expect(() => service.decryptWalletKey(encrypted, 'wrong-secret')).toThrow();
    });

    it('throws on malformed encrypted string', () => {
      expect(() => service.decryptWalletKey('notvalid', secret)).toThrow();
    });
  });
});
