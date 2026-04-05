// src/app/admin/draws/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { serializeBigInt, safeCurrency } from '@/lib/utils'
import { Plus, ChevronRight, BarChart2 } from 'lucide-react'

export default async function AdminDrawsPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/')

  const draws = await prisma.draw.findMany({
    orderBy: { drawDate: 'desc' },
    include: { _count: { select: { tickets: true, winners: true } } },
  })

  const data = serializeBigInt(draws)

  const statusBadge: Record<string, string> = {
    SCHEDULED: 'badge-scheduled', LIVE: 'badge-live',
    COMPLETED: 'badge-completed', CANCELLED: 'badge-unverified',
  }

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-white/30 text-sm mb-1">Admin · <Link href="/admin" className="hover:text-white/60">Dashboard</Link></p>
              <h1 className="font-display text-2xl font-bold">Manage Draws</h1>
            </div>
            <Link href="/admin/draws/new" className="btn-gold px-5 py-2.5 text-sm flex items-center gap-2">
              <Plus size={16} /> New Draw
            </Link>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
              <BarChart2 size={16} className="text-white/40" />
              <span className="text-sm text-white/60">{draws.length} draws total</span>
            </div>
            <table className="lottery-table">
              <thead>
                <tr>
                  <th>Draw Name</th>
                  <th>Date</th>
                  <th>Jackpot</th>
                  <th>Tickets</th>
                  <th>Winners</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data as any[]).map((draw: any) => (
                  <tr key={draw.id}>
                    <td className="font-medium text-white">{draw.name}</td>
                    <td className="text-white/50 text-xs">{new Date(draw.drawDate).toLocaleDateString()}</td>
                    <td className="font-mono text-yellow-400 text-sm">{safeCurrency(draw.jackpotAmount)}</td>
                    <td className="font-mono text-sm">{draw._count.tickets}</td>
                    <td className="font-mono text-sm">{draw._count.winners}</td>
                    <td><span className={`badge ${statusBadge[draw.status] ?? ''}`}>{draw.status}</span></td>
                    <td>
                      <Link href={`/admin/draws/${draw.id}`}
                            className="flex items-center gap-1 text-white/30 hover:text-white/70 text-xs transition-colors">
                        Manage <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {draws.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-white/25 py-8">No draws yet. Create your first draw.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
