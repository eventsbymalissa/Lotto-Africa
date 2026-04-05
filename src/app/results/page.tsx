// src/app/results/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/ui/Navbar'
import ResultsClient from '@/components/lottery/ResultsClient'
import { serializeBigInt } from '@/lib/utils'

export const revalidate = 60

export default async function ResultsPage() {
  const session = await getSession()

  let tokenBalance = 0
  let userTickets: any[] = []

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { tokenBalance: true },
    })
    tokenBalance = user?.tokenBalance ?? 0

    userTickets = await prisma.ticket.findMany({
      where: { userId: session.userId },
      select: { id: true, numbers: true, drawId: true, prizeTier: true, prizeAmount: true },
    })
  }

  const completedDraws = await prisma.draw.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { drawDate: 'desc' },
    take: 20,
    include: {
      _count: { select: { tickets: true, winners: true } },
      winners: {
        select: { prizeTier: true, prizeAmount: true, verified: true },
      },
    },
  })

  const data = serializeBigInt({ completedDraws, userTickets })

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} tokenBalance={tokenBalance} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl font-bold mb-2">Draw Results</h1>
            <p className="text-white/40">All results are cryptographically verified and publicly auditable</p>
          </div>

          <ResultsClient
            draws={(data as any).completedDraws}
            userTickets={(data as any).userTickets}
            isLoggedIn={!!session}
          />
        </div>
      </div>
    </div>
  )
}
