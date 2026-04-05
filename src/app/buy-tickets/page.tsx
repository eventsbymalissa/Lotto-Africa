// src/app/buy-tickets/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import TicketPickerClient from '@/components/lottery/TicketPickerClient'
import { formatCurrency, formatDate } from '@/lib/utils'
import { serializeBigInt } from '@/lib/utils'

export default async function BuyTicketsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [user, draws] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { tokenBalance: true, verificationStatus: true, firstName: true },
    }),
    prisma.draw.findMany({
      where: { status: { in: ['SCHEDULED', 'LIVE'] } },
      orderBy: { drawDate: 'asc' },
    }),
  ])

  if (!user) redirect('/login')
  if (user.verificationStatus !== 'VERIFIED') redirect('/verify-id')

  const serializedDraws = serializeBigInt(draws)

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} tokenBalance={user.tokenBalance} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Buy Tickets</h1>
            <p className="text-white/40">Pick your numbers or use Quick Pick</p>
          </div>

          {draws.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-white/40 text-lg">No upcoming draws at the moment.</p>
              <p className="text-white/25 text-sm mt-2">Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {serializedDraws.map((draw: any) => (
                <div key={draw.id} className="glass-card p-6">
                  {/* Draw info */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${draw.status === 'LIVE' ? 'badge-live' : 'badge-scheduled'}`}>
                          {draw.status === 'LIVE' ? '🔴 Live' : 'Upcoming'}
                        </span>
                      </div>
                      <h2 className="font-display text-xl font-bold">{draw.name}</h2>
                      <p className="text-white/40 text-sm mt-1">{formatDate(draw.drawDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40 text-xs uppercase tracking-wider">Jackpot</p>
                      <p className="font-display text-2xl font-bold text-yellow-400">
                        {formatCurrency(BigInt(draw.jackpotAmount))}
                      </p>
                      <p className="text-white/30 text-xs mt-1">{draw.ticketPrice} tokens per ticket</p>
                    </div>
                  </div>

                  <TicketPickerClient
                    drawId={draw.id}
                    ticketPrice={draw.ticketPrice}
                    userTokenBalance={user.tokenBalance}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
