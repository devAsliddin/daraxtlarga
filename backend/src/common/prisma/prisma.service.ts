import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'test') {
      if ((process.env.DATABASE_URL || '').startsWith('file:')) {
        const tables = await this.$queryRaw<Array<{ name: string }>>`
          SELECT name FROM sqlite_master WHERE type='table'
        `;

        for (const { name } of tables) {
          if (!name.startsWith('_prisma_') && name !== 'sqlite_sequence') {
            await this.$executeRawUnsafe(`DELETE FROM "${name}";`);
          }
        }
        return;
      }

      const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname='public'
      `;
      for (const { tablename } of tablenames) {
        if (tablename !== '_prisma_migrations') {
          await this.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
        }
      }
    }
  }
}
