// src/app/api/tokens/purchase/route.ts
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return apiError('Unauthorized', 401)

    const { packageId } = await req.json()
    if (!packageId) return apiError('Package ID required')

    const pkg = await prisma.tokenPackage.findUnique({ where: { id: packageId } })
    if (!pkg || !pkg.isActive) return apiError('Package not found')

    const totalTokens = pkg.tokens + pkg.bonusTokens

    // In production: create Stripe PaymentIntent and verify payment
    // For now, simulate successful payment
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.userId },
        data: { tokenBalance: { increment: totalTokens } },
      }),
      prisma.transaction.create({
        data: {
          userId: session.userId,
          type: 'TOKEN_PURCHASE',
          status: 'COMPLETED',
          amount: BigInt(pkg.priceUsd),
          tokenAmount: totalTokens,
          description: pkg.name,
          metadata: { packageId: pkg.id, baseTokens: pkg.tokens, bonusTokens: pkg.bonusTokens },
        },
      }),
    ])

    return apiSuccess({ tokensAdded: totalTokens })
  } catch (err) {
    console.error('Token purchase error:', err)
    return apiError('Internal server error', 500)
  }
}
