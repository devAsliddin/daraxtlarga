import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, generateKeyPairSync } from 'crypto';

const prisma = new PrismaClient();

function hashChain(data: object, prevHash: string): string {
  const content = JSON.stringify(data) + prevHash;
  return createHash('sha256').update(content).digest('hex');
}

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 12);
  const adminKey = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@yashilquest.uz' },
    update: {},
    create: {
      email: 'admin@yashilquest.uz',
      username: 'admin',
      passwordHash: adminHash,
      walletAddress: adminKey.publicKey.replace(/\n/g, '').slice(0, 64),
      walletPrivKey: adminKey.privateKey,
      level: 99,
      xp: 99999,
      totalTokens: 1000,
      region: 'Toshkent',
    },
  });

  // Create demo user
  const demoHash = await bcrypt.hash('demo123', 12);
  const demoKey = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const demo = await prisma.user.upsert({
    where: { email: 'demo@yashilquest.uz' },
    update: {},
    create: {
      email: 'demo@yashilquest.uz',
      username: 'EcoHero_01',
      passwordHash: demoHash,
      walletAddress: demoKey.publicKey.replace(/\n/g, '').slice(0, 64),
      walletPrivKey: demoKey.privateKey,
      level: 5,
      xp: 1250,
      totalTokens: 150,
      region: 'Toshkent',
    },
  });

  // Seed tree locations (Uzbekistan coordinates)
  const locations = [
    { lat: 41.2995, lng: 69.2401, region: 'Toshkent', district: 'Chilonzor', stateReportedCount: 50, status: 'PENDING' },
    { lat: 41.3111, lng: 69.2797, region: 'Toshkent', district: 'Yunusobod', stateReportedCount: 120, status: 'PENDING' },
    { lat: 41.2670, lng: 69.2179, region: 'Toshkent', district: 'Sergeli', stateReportedCount: 80, status: 'PENDING' },
    { lat: 41.3250, lng: 69.3100, region: 'Toshkent', district: 'Mirzo Ulugbek', stateReportedCount: 200, status: 'VERIFIED' },
    { lat: 41.2850, lng: 69.1950, region: 'Toshkent', district: 'Uchtepa', stateReportedCount: 30, status: 'DISPUTED' },
    { lat: 39.6542, lng: 66.9597, region: 'Samarqand', district: 'Markaz', stateReportedCount: 150, status: 'PENDING' },
    { lat: 39.7747, lng: 64.4286, region: 'Buxoro', district: 'Markaz', stateReportedCount: 75, status: 'PENDING' },
    { lat: 40.0824, lng: 65.3792, region: 'Navoiy', district: 'Navoiy', stateReportedCount: 300, status: 'FRAUD' },
    { lat: 41.5500, lng: 60.6333, region: 'Xorazm', district: 'Urganch', stateReportedCount: 90, status: 'PENDING' },
    { lat: 40.7833, lng: 72.3333, region: 'Farg\'ona', district: 'Farg\'ona', stateReportedCount: 180, status: 'VERIFIED' },
    { lat: 41.1000, lng: 71.4667, region: 'Namangan', district: 'Namangan', stateReportedCount: 110, status: 'PENDING' },
    { lat: 40.3667, lng: 71.7833, region: 'Andijon', district: 'Andijon', stateReportedCount: 95, status: 'PENDING' },
    { lat: 38.8667, lng: 65.7833, region: 'Qashqadaryo', district: 'Qarshi', stateReportedCount: 60, status: 'PENDING' },
    { lat: 37.9333, lng: 67.5667, region: 'Surxondaryo', district: 'Termiz', stateReportedCount: 45, status: 'PENDING' },
    { lat: 40.9000, lng: 69.2833, region: 'Sirdaryo', district: 'Guliston', stateReportedCount: 70, status: 'PENDING' },
  ];

  let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  for (const loc of locations) {
    const existing = await prisma.treeLocation.findFirst({
      where: { lat: loc.lat, lng: loc.lng },
    });
    if (!existing) {
      const hash = hashChain(loc, prevHash);
      const created = await prisma.treeLocation.create({
        data: { ...loc, blockchainHash: hash, prevHash },
      });
      prevHash = hash;
    }
  }

  // Seed badges
  const badges = [
    { name: 'Birinchi Daraxt', icon: '🌱', description: 'Birinchi daraxtni tasdiqladi', unlockCriteria: { verifications: 1 }, rarity: 'common' },
    { name: 'Yashil Qahramon', icon: '🦸', description: '10 ta daraxtni tasdiqladi', unlockCriteria: { verifications: 10 }, rarity: 'rare' },
    { name: 'Mezon Soqchi', icon: '🕵️', description: 'Birinchi firibgarlikni aniqladi', unlockCriteria: { fraudReports: 1 }, rarity: 'rare' },
    { name: 'Milliy Qahraon', icon: '🏆', description: '100 ta daraxtni tasdiqladi', unlockCriteria: { verifications: 100 }, rarity: 'legendary' },
    { name: 'Monitoring Ustasi', icon: '📊', description: '30 ta monitoring o\'tkazdi', unlockCriteria: { monitorings: 30 }, rarity: 'epic' },
    { name: 'Ekolog', icon: '🌍', description: '50 ta daraxtni tasdiqladi', unlockCriteria: { verifications: 50 }, rarity: 'epic' },
    { name: 'Token Boyar', icon: '💰', description: '500 ta Green Token to\'pladi', unlockCriteria: { tokens: 500 }, rarity: 'rare' },
    { name: 'Izchil', icon: '🔥', description: '7 kun ketma-ket faollik', unlockCriteria: { streak: 7 }, rarity: 'common' },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: {
        ...badge,
        unlockCriteria: JSON.stringify(badge.unlockCriteria),
      },
    });
  }

  // Seed quests
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const quests = [
    {
      title: 'Kunlik Yashil',
      description: 'Bugun 3 ta daraxtni tasdiqlang',
      type: 'DAILY' as const,
      rewardTokens: 3,
      xpReward: 50,
      completionCriteria: JSON.stringify({ type: 'verify', count: 3 }),
      activeFrom: now,
      activeUntil: tomorrow,
      iconName: 'leaf',
    },
    {
      title: 'Haftalik Tekshiruv',
      description: 'Bu hafta 15 ta daraxtni tasdiqlang',
      type: 'WEEKLY' as const,
      rewardTokens: 15,
      xpReward: 200,
      completionCriteria: JSON.stringify({ type: 'verify', count: 15 }),
      activeFrom: now,
      activeUntil: nextWeek,
      iconName: 'tree',
    },
    {
      title: 'Firibgarni Toping',
      description: 'Bitta noto\'g\'ri hisobotni aniqlang',
      type: 'WEEKLY' as const,
      rewardTokens: 20,
      xpReward: 300,
      completionCriteria: JSON.stringify({ type: 'fraud_report', count: 1 }),
      activeFrom: now,
      activeUntil: nextWeek,
      iconName: 'shield',
    },
    {
      title: 'Monitoring Kundaligi',
      description: 'Bugun 2 ta avval tasdiqlangan daraxtni qayta tekshiring',
      type: 'DAILY' as const,
      rewardTokens: 5,
      xpReward: 75,
      completionCriteria: JSON.stringify({ type: 'monitor', count: 2 }),
      activeFrom: now,
      activeUntil: tomorrow,
      iconName: 'eye',
    },
  ];

  for (const quest of quests) {
    await prisma.quest.create({ data: quest }).catch(() => {}); // ignore duplicates
  }

  console.log('Seeding complete!');
  console.log('Admin: admin@yashilquest.uz / admin123');
  console.log('Demo: demo@yashilquest.uz / demo123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
