// src/app/api/tickets/purchase/route.ts
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return apiError('Unauthorized', 401)
    if (session.verificationStatus !== 'VERIFIED') return apiError('Identity verification required', 403)

    const { drawId, tickets } = await req.json()

    if (!drawId || !Array.isArray(tickets) || tickets.length === 0)
      return apiError('Invalid request')
    if (tickets.length > 10) return apiError('Maximum 10 tickets per purchase')

    const [draw, user] = await Promise.all([
      prisma.draw.findUnique({ where: { id: drawId } }),
      prisma.user.findUnique({ where: { id: session.userId } }),
    ])

    if (!draw) return apiError('Draw not found')
    if (draw.status !== 'SCHEDULED' && draw.status !== 'LIVE') return apiError('Draw is not accepting tickets')
    if (!user) return apiError('User not found')

    const totalCost = tickets.length * draw.ticketPrice
    if (user.tokenBalance < totalCost) return apiError('Insufficient token balance')

    for (const ticket of tickets) {
      if (!Array.isArray(ticket) || ticket.length !== 6) return apiError('Each ticket must have exactly 6 numbers')
      if (ticket.some((n: number) => n < 1 || n > 49)) return apiError('Numbers must be between 1 and 49')
      if (new Set(ticket).size !== 6) return apiError('Numbers must be unique')
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.userId },
        data: { tokenBalance: { decrement: totalCost } },
      }),
      prisma.ticket.createMany({
        data: tickets.map((numbers: number[]) => ({
          userId: session.userId,
          drawId,
          numbers: numbers.sort((a: number, b: number) => a - b),
          tokenCost: draw.ticketPrice,
          isQuickPick: false,
        })),
      }),
      prisma.transaction.create({
        data: {
          userId: session.userId,
          type: 'TICKET_PURCHASE',
          status: 'COMPLETED',
          amount: 0,
          tokenAmount: -totalCost,
          description: `${tickets.length} ticket(s) for ${draw.name}`,
          reference: drawId,
        },
      }),
    ])

    return apiSuccess({ ticketCount: tickets.length, tokensSpent: totalCost })
  } catch (err) {
    console.error('Ticket purchase error:', err)
    return apiError('Internal server error', 500)
  }
}
