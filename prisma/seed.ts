// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminHash = await bcrypt.hash('Admin@123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lottery.com' },
    update: {},
    create: {
      email: 'admin@lottery.com',
      passwordHash: adminHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      verificationStatus: 'VERIFIED',
      tokenBalance: 9999,
    },
  })

  // Create test player
  const playerHash = await bcrypt.hash('Player@123456', 12)
  const player = await prisma.user.upsert({
    where: { email: 'player@lottery.com' },
    update: {},
    create: {
      email: 'player@lottery.com',
      passwordHash: playerHash,
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'PLAYER',
      verificationStatus: 'VERIFIED',
      tokenBalance: 50,
    },
  })

  // Create token packages
  await prisma.tokenPackage.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Starter Pack', tokens: 10, priceUsd: 500, bonusTokens: 0 },
      { name: 'Value Pack', tokens: 25, priceUsd: 1000, bonusTokens: 3 },
      { name: 'Power Pack', tokens: 60, priceUsd: 2000, bonusTokens: 10 },
      { name: 'Elite Pack', tokens: 150, priceUsd: 4500, bonusTokens: 30 },
    ],
  })

  // Create upcoming draw
  const nextDraw = new Date()
  nextDraw.setDate(nextDraw.getDate() + 3)
  nextDraw.setHours(21, 0, 0, 0)

  await prisma.draw.create({
    data: {
      name: 'MegaWin Jackpot #1',
      drawDate: nextDraw,
      jackpotAmount: BigInt(5000000 * 100), // $5M in cents
      ticketPrice: 2, // 2 tokens per ticket
      status: 'SCHEDULED',
      drawSeed: null,
    },
  })

  console.log('Seed complete. Admin:', admin.email, '| Player:', player.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
