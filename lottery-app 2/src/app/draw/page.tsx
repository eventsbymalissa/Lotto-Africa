// src/app/draw/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/ui/Navbar'
import LiveDrawClient from '@/components/lottery/LiveDrawClient'
import { serializeBigInt } from '@/lib/utils'

export const revalidate = 10

export default async function DrawPage() {
  const session = await getSession()

  let tokenBalance = 0
  if (session) {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { tokenBalance: true } })
    tokenBalance = user?.tokenBalance ?? 0
  }

  const liveDraw = await prisma.draw.findFirst({
    where: { status: { in: ['LIVE', 'SCHEDULED'] } },
    orderBy: { drawDate: 'asc' },
    include: { _count: { select: { tickets: true } } },
  })

  const recentCompleted = await prisma.draw.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { drawDate: 'desc' },
    take: 5,
    include: { _count: { select: { tickets: true, winners: true } } },
  })

  const data = serializeBigInt({ liveDraw, recentCompleted })

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} tokenBalance={tokenBalance} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl font-bold mb-2">Live Draw</h1>
            <p className="text-white/40">Every draw is cryptographically seeded and verifiable</p>
          </div>

          <LiveDrawClient draw={(data as any).liveDraw} recentDraws={(data as any).recentCompleted} />
        </div>
      </div>
    </div>
  )
}
