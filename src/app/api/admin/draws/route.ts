// src/app/api/admin/draws/route.ts
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, serializeBigInt } from '@/lib/utils'
import { generateDrawSeed, commitDrawSeed } from '@/lib/draw-verification'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return apiError('Unauthorized', 401)

    const { name, drawDate, jackpotAmount, ticketPrice } = await req.json()
    if (!name || !drawDate || !jackpotAmount || !ticketPrice)
      return apiError('All fields required')

    // Pre-commit draw seed for transparency
    const seed = generateDrawSeed()
    const hash = commitDrawSeed(seed)

    const draw = await prisma.draw.create({
      data: {
        name,
        drawDate: new Date(drawDate),
        jackpotAmount: BigInt(jackpotAmount),
        ticketPrice,
        status: 'SCHEDULED',
        drawSeed: seed,   // In production: store seed secretly, only publish hash
        drawHash: hash,   // Publish this immediately so players can verify later
      },
    })

    return apiSuccess(serializeBigInt(draw), 201)
  } catch (err) {
    console.error('Create draw error:', err)
    return apiError('Internal server error', 500)
  }
}
