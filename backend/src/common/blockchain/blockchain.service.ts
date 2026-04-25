import { Injectable, Logger } from '@nestjs/common';
import { createHash, generateKeyPairSync, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface BlockchainRecord {
  version: number;
  timestamp: string;
  entityType: string;
  entityId: string;
  userId?: string;
  action: string;
  data: object;
  prevHash: string;
  thisHash: string;
}

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly GENESIS_HASH = '0'.repeat(64);

  /**
   * Create a new chained record
   */
  createRecord(
    entityType: string,
    entityId: string,
    action: string,
    data: object,
    userId?: string,
    prevHash: string = this.GENESIS_HASH,
  ): BlockchainRecord {
    const record: Omit<BlockchainRecord, 'thisHash'> = {
      version: 1,
      timestamp: new Date().toISOString(),
      entityType,
      entityId,
      action,
      data,
      userId,
      prevHash,
    };

    const thisHash = this.hash(JSON.stringify(record));

    return { ...record, thisHash };
  }

  /**
   * Verify integrity of a record chain
   */
  verifyRecord(record: BlockchainRecord, prevHash: string): boolean {
    const { thisHash, ...rest } = record;
    const computedHash = this.hash(JSON.stringify(rest));
    const hashValid = computedHash === thisHash;
    const chainValid = record.prevHash === prevHash;
    return hashValid && chainValid;
  }

  /**
   * Hash any string with SHA-256
   */
  hash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * Generate a new user wallet keypair
   */
  generateWallet(): { publicKey: string; privateKey: string; address: string } {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    // Derive wallet address from public key hash
    const address = 'YQ' + this.hash(publicKey).slice(0, 40).toUpperCase();

    return { publicKey, privateKey, address };
  }

  /**
   * Hash a verification submission for immutable record
   */
  hashVerification(
    treeId: string,
    userId: string,
    photos: string[],
    gpsLat: number,
    gpsLng: number,
    cvResult: object,
    prevHash: string,
  ): string {
    const data = { treeId, userId, photos, gpsLat, gpsLng, cvResult, ts: Date.now() };
    return this.hash(JSON.stringify(data) + prevHash);
  }

  /**
   * Encrypt a wallet private key with AES-256-GCM.
   * The secret must be at least 32 bytes; it is SHA-256 hashed so any length works.
   * Output format: hex(iv):hex(authTag):hex(ciphertext)
   */
  encryptWalletKey(privateKey: string, secret: string): string {
    const key = createHash('sha256').update(secret).digest();
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypt a wallet private key encrypted with encryptWalletKey().
   */
  decryptWalletKey(encrypted: string, secret: string): string {
    const parts = encrypted.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted key format');
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const key = createHash('sha256').update(secret).digest();
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    return decipher.update(Buffer.from(ciphertextHex, 'hex')).toString('utf8') + decipher.final('utf8');
  }

  /**
   * Format a blockchain record as a human-readable certificate
   */
  formatCertificate(record: BlockchainRecord): string {
    return `
=== YASHIL QUEST BLOCKCHAIN CERTIFICATE ===
Entity: ${record.entityType} (${record.entityId})
Action: ${record.action}
Timestamp: ${record.timestamp}
Previous Hash: ${record.prevHash.slice(0, 16)}...
This Hash: ${record.thisHash.slice(0, 16)}...
============================================
`.trim();
  }
}
