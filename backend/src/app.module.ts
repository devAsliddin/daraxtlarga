import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TreesModule } from './modules/trees/trees.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { QuestsModule } from './modules/quests/quests.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { OllamaModule } from './common/ollama/ollama.module';
import { MinioModule } from './common/minio/minio.module';
import { BlockchainModule } from './common/blockchain/blockchain.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    OllamaModule,
    MinioModule,
    BlockchainModule,
    AuthModule,
    UsersModule,
    TreesModule,
    TokensModule,
    QuestsModule,
    LeaderboardModule,
    ReportsModule,
    AdminModule,
  ],
})
export class AppModule {}
