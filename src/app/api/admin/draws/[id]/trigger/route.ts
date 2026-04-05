// src/app/api/admin/draws/[id]/trigger/route.ts
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'
import {
  generateWinningNumbers,
  generateBonusNumber,
  checkTicketWin,
  generateWinnerProof,
} from '@/lib/draw-verification'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return apiError('Unauthorized', 401)

    const draw = await prisma.draw.findUnique({
      where: { id: params.id },
      include: { tickets: { include: { user: true } } },
    })

    if (!draw) return apiError('Draw not found')
    if (draw.status === 'COMPLETED') return apiError('Draw already completed')
    if (!draw.drawSeed) return apiError('Draw has no seed - cannot trigger')

    const winningNumbers = generateWinningNumbers(draw.drawSeed)
    const bonusNumber = generateBonusNumber(draw.drawSeed, winningNumbers)
    const jackpotAmountNum = draw.jackpotAmount

    const claimDeadline = new Date()
    claimDeadline.setDate(claimDeadline.getDate() + 90)

    const winnerData: {
      drawId: string
      userId: string
      ticketId: string
      prizeTier: string
      prizeAmount: number
      claimDeadline: Date
      verificationProof: string
    }[] = []

    const ticketUpdateData: {
      id: string
      prizeTier?: string
      prizeAmount?: number
      isChecked: boolean
    }[] = []

    for (const ticket of draw.tickets) {
      const { tier, amount } = checkTicketWin(
        ticket.numbers,
        ticket.bonusNumber,
        winningNumbers,
        bonusNumber,
        jackpotAmountNum
      )

      if (tier && amount > 0) {
        const proof = generateWinnerProof({
          drawId: draw.id,
          drawName: draw.name,
          drawDate: draw.drawDate.toISOString(),
          drawSeed: draw.drawSeed,
          committedHash: draw.drawHash ?? '',
          winningNumbers,
          bonusNumber,
          ticketId: ticket.id,
          ticketNumbers: ticket.numbers,
          userId: ticket.userId,
          prizeTier: tier.name,
          prizeAmount: amount.toString(),
          verifiedAt: new Date().toISOString(),
        })

        winnerData.push({
          drawId: draw.id,
          userId: ticket.userId,
          ticketId: ticket.id,
          prizeTier: tier.name,
          prizeAmount: amount,
          claimDeadline,
          verificationProof: JSON.stringify(proof),
        })

        ticketUpdateData.push({
          id: ticket.id,
          prizeTier: tier.name,
          prizeAmount: amount,
          isChecked: true,
        })
      } else {
        ticketUpdateData.push({ id: ticket.id, isChecked: true })
      }
    }

    await prisma.$transaction([
      prisma.draw.update({
        where: { id: draw.id },
        data: { status: 'COMPLETED', winningNumbers, bonusNumber },
      }),
      ...winnerData.map(w => prisma.winner.create({ data: w })),
      ...ticketUpdateData.map(t =>
        prisma.ticket.update({
          where: { id: t.id },
          data: {
            isChecked: t.isChecked,
            prizeTier: t.prizeTier ?? null,
            prizeAmount: t.prizeAmount ?? null,
          },
        })
      ),
    ])

    const updated = await prisma.draw.findUnique({
      where: { id: draw.id },
      include: {
        tickets: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        winners: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        _count: { select: { tickets: true, winners: true } },
      },
    })

    return apiSuccess(updated)
  } catch (err) {
    console.error('Trigger draw error:', err)
    return apiError('Internal server error', 500)
  }
}
