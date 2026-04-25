import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const statements = [
  'PRAGMA foreign_keys = ON;',
  `
  CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "walletPrivKey" TEXT NOT NULL,
    "totalTokens" REAL NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "avatarUrl" TEXT,
    "region" TEXT,
    "referredBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `,
  'CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");',
  'CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone");',
  'CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");',
  'CREATE UNIQUE INDEX IF NOT EXISTS "users_walletAddress_key" ON "users"("walletAddress");',
  `
  CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );
  `,
  'CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_key" ON "refresh_tokens"("token");',
  `
  CREATE TABLE IF NOT EXISTS "tree_locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "stateReportedCount" INTEGER NOT NULL DEFAULT 1,
    "actualCount" INTEGER,
    "region" TEXT NOT NULL,
    "district" TEXT,
    "plantationDate" DATETIME,
    "species" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedByUserId" TEXT,
    "verifiedAt" DATETIME,
    "blockchainHash" TEXT,
    "prevHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS "tree_verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "treeLocationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photos" TEXT NOT NULL,
    "livenessProof" TEXT NOT NULL,
    "exifData" TEXT,
    "cvResult" TEXT,
    "healthScore" REAL,
    "treeCount" INTEGER,
    "tokensEarned" REAL NOT NULL DEFAULT 0,
    "blockchainHash" TEXT,
    "prevHash" TEXT,
    "isMonitoring" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tree_verifications_treeLocationId_fkey" FOREIGN KEY ("treeLocationId") REFERENCES "tree_locations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tree_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS "green_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "transactionType" TEXT NOT NULL,
    "referenceId" TEXT,
    "description" TEXT,
    "blockchainHash" TEXT,
    "prevHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "green_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS "quests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rewardTokens" REAL NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "completionCriteria" TEXT NOT NULL,
    "iconName" TEXT,
    "activeFrom" DATETIME NOT NULL,
    "activeUntil" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS "user_quests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "progress" TEXT NOT NULL DEFAULT '{}',
    "completedAt" DATETIME,
    "claimedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_quests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );
  `,
  'CREATE UNIQUE INDEX IF NOT EXISTS "user_quests_userId_questId_key" ON "user_quests"("userId", "questId");',
  `
  CREATE TABLE IF NOT EXISTS "badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unlockCriteria" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common'
  );
  `,
  'CREATE UNIQUE INDEX IF NOT EXISTS "badges_name_key" ON "badges"("name");',
  `
  CREATE TABLE IF NOT EXISTS "user_badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );
  `,
  'CREATE UNIQUE INDEX IF NOT EXISTS "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");',
  `
  CREATE TABLE IF NOT EXISTS "fraud_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "treeLocationId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "anticorruptionRef" TEXT,
    "adminNotes" TEXT,
    "blockchainHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fraud_reports_treeLocationId_fkey" FOREIGN KEY ("treeLocationId") REFERENCES "tree_locations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fraud_reports_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );
  `,
];

async function main() {
  await prisma.$connect();

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log('SQLite schema initialized.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
