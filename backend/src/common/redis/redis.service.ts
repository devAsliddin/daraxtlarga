import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly stringStore = new Map<string, string>();
  private readonly sortedSets = new Map<string, Map<string, number>>();
  private readonly expirations = new Map<string, number>();
  private readonly redisEnabled: boolean;
  private redis?: Redis;

  constructor(private readonly config: ConfigService) {
    this.redisEnabled = config.get('REDIS_ENABLED', 'false') === 'true';
    void this.initializeRedis();
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
    }
  }

  private async initializeRedis() {
    if (!this.redisEnabled) {
      this.logger.log('Redis disabled. Using in-memory cache.');
      return;
    }

    try {
      const RedisModule = (await import('ioredis')).default;
      const client = new RedisModule({
        host: this.config.get('REDIS_HOST', 'localhost'),
        port: this.config.get<number>('REDIS_PORT', 6379),
        password: this.config.get('REDIS_PASSWORD') || undefined,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      await client.connect();
      this.redis = client;
      this.logger.log('Connected to Redis.');
    } catch (error) {
      this.logger.warn(`Redis unavailable, switching to in-memory cache: ${error.message}`);
      this.redis = undefined;
    }
  }

  private isExpired(key: string): boolean {
    const expiresAt = this.expirations.get(key);
    if (!expiresAt) {
      return false;
    }

    if (Date.now() <= expiresAt) {
      return false;
    }

    this.expirations.delete(key);
    this.stringStore.delete(key);
    this.sortedSets.delete(key);
    return true;
  }

  private getSortedSet(key: string): Map<string, number> {
    this.isExpired(key);
    let sortedSet = this.sortedSets.get(key);
    if (!sortedSet) {
      sortedSet = new Map<string, number>();
      this.sortedSets.set(key, sortedSet);
    }
    return sortedSet;
  }

  async get(key: string): Promise<string | null> {
    if (this.redis) {
      return this.redis.get(key);
    }

    if (this.isExpired(key)) {
      return null;
    }

    return this.stringStore.get(key) ?? null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.redis) {
      if (ttlSeconds) {
        await this.redis.set(key, value, 'EX', ttlSeconds);
        return;
      }

      await this.redis.set(key, value);
      return;
    }

    this.stringStore.set(key, value);
    if (ttlSeconds) {
      this.expirations.set(key, Date.now() + ttlSeconds * 1000);
    } else {
      this.expirations.delete(key);
    }
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key);
      return;
    }

    this.stringStore.delete(key);
    this.sortedSets.delete(key);
    this.expirations.delete(key);
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    if (this.redis) {
      await this.redis.zadd(key, score, member);
      return;
    }

    this.getSortedSet(key).set(member, score);
  }

  async zincrby(key: string, amount: number, member: string): Promise<number> {
    if (this.redis) {
      const score = await this.redis.zincrby(key, amount, member);
      return typeof score === 'string' ? parseFloat(score) : score;
    }

    const sortedSet = this.getSortedSet(key);
    const nextScore = (sortedSet.get(member) ?? 0) + amount;
    sortedSet.set(member, nextScore);
    return nextScore;
  }

  async zrevrange(key: string, start: number, stop: number, withScores = false): Promise<string[]> {
    if (this.redis) {
      if (withScores) {
        return this.redis.zrevrange(key, start, stop, 'WITHSCORES');
      }
      return this.redis.zrevrange(key, start, stop);
    }

    const entries = Array.from(this.getSortedSet(key).entries()).sort((a, b) => b[1] - a[1]);
    const normalizedStop = stop < 0 ? entries.length - 1 : stop;
    const slice = entries.slice(start, normalizedStop + 1);

    if (!withScores) {
      return slice.map(([member]) => member);
    }

    return slice.flatMap(([member, score]) => [member, String(score)]);
  }

  async zrank(key: string, member: string): Promise<number | null> {
    if (this.redis) {
      return this.redis.zrevrank(key, member);
    }

    const sorted = Array.from(this.getSortedSet(key).entries()).sort((a, b) => b[1] - a[1]);
    const index = sorted.findIndex(([candidate]) => candidate === member);
    return index === -1 ? null : index;
  }

  async zscore(key: string, member: string): Promise<string | null> {
    if (this.redis) {
      return this.redis.zscore(key, member);
    }

    const score = this.getSortedSet(key).get(member);
    return score === undefined ? null : String(score);
  }

  async incr(key: string): Promise<number> {
    if (this.redis) {
      return this.redis.incr(key);
    }

    if (this.isExpired(key)) {
      this.stringStore.delete(key);
    }

    const nextValue = Number(this.stringStore.get(key) ?? '0') + 1;
    this.stringStore.set(key, String(nextValue));
    return nextValue;
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (this.redis) {
      await this.redis.expire(key, seconds);
      return;
    }

    if (this.stringStore.has(key) || this.sortedSets.has(key)) {
      this.expirations.set(key, Date.now() + seconds * 1000);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (this.redis) {
      const result = await this.redis.exists(key);
      return result === 1;
    }

    if (this.isExpired(key)) {
      return false;
    }

    return this.stringStore.has(key) || this.sortedSets.has(key);
  }

  async publish(channel: string, message: string): Promise<void> {
    if (this.redis) {
      await this.redis.publish(channel, message);
      return;
    }

    this.logger.debug(`Redis publish skipped in memory mode: ${channel} -> ${message}`);
  }
}
