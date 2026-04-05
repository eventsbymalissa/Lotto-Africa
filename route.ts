// src/app/api/admin/winners/[id]/verify/route.ts
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'
import { verifyWinnerProof } from '@/lib/draw-verification'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return apiError('Unauthorized', 401)

    const winner = await prisma.winner.findUnique({
      where: { id: params.id },
      include: {
        draw: true,
        ticket: true,
        user: { select: { firstName: true, lastName: true, email: true, verificationStatus: true } },
      },
    })

    if (!winner) return apiError('Winner not found')
    if (winner.verified) return apiError('Already verified')

    // Verify the user's identity is confirmed before paying out
    if (winner.user.verificationStatus !== 'VERIFIED') {
      return apiError('Player identity not verified — cannot confirm winnings')
    }

    // Verify the cryptographic proof
    if (winner.verificationProof) {
      const proof = JSON.parse(winner.verificationProof)
      const valid = verifyWinnerProof(proof)
      if (!valid) {
        return apiError('Cryptographic proof verification failed — this win may be invalid')
      }
    }

    await prisma.$transaction([
      prisma.winner.update({
        where: { id: winner.id },
        data: {
          verified: true,
          verifiedAt: new Date(),
          verifiedBy: session.userId,
        },
      }),
      // Credit winnings as a transaction record
      prisma.transaction.create({
        data: {
          userId: winner.userId,
          type: 'WINNINGS_CREDIT',
          status: 'COMPLETED',
          amount: winner.prizeAmount,
          description: `${winner.prizeTier} — ${winner.draw.name}`,
          reference: winner.id,
        },
      }),
    ])

    return apiSuccess({ verified: true, winnerId: winner.id })
  } catch (err) {
    console.error('Verify winner error:', err)
    return apiError('Internal server error', 500)
  }
}
