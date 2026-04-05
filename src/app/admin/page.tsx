// src/app/admin/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { serializeBigInt, safeCurrency } from '@/lib/utils'
import { Users, Ticket, Trophy, DollarSign, ShieldCheck, Clock, PlayCircle, BarChart2, ChevronRight } from 'lucide-react'

export default async function AdminDashboard() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/')

  const [
    totalUsers, pendingVerifications, activeDraws,
    totalWinners, recentUsers, draws, recentTransactions
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'PLAYER' } }),
    prisma.user.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.draw.count({ where: { status: { in: ['SCHEDULED', 'LIVE'] } } }),
    prisma.winner.count(),
    prisma.user.findMany({
      where: { role: 'PLAYER' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, firstName: true, lastName: true, email: true, verificationStatus: true, tokenBalance: true, createdAt: true },
    }),
    prisma.draw.findMany({
      orderBy: { drawDate: 'desc' },
      take: 5,
      include: { _count: { select: { tickets: true, winners: true } } },
    }),
    prisma.transaction.findMany({
      where: { type: 'TOKEN_PURCHASE', status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
  ])

  const data = serializeBigInt({ recentUsers, draws, recentTransactions })

  const statsCards = [
    { label: 'Total Players',   value: totalUsers,            icon: Users,       color: '#4361ee' },
    { label: 'Pending KYC',     value: pendingVerifications,  icon: ShieldCheck, color: '#fbbf24', alert: pendingVerifications > 0 },
    { label: 'Active Draws',    value: activeDraws,           icon: PlayCircle,  color: '#2dc653' },
    { label: 'Total Winners',   value: totalWinners,          icon: Trophy,      color: '#f59e0b' },
  ]

  const verBadge: Record<string, string> = {
    VERIFIED: 'badge-verified', PENDING: 'badge-pending',
    UNVERIFIED: 'badge-unverified', REJECTED: 'badge-rejected',
  }

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-white/30 text-sm uppercase tracking-wider mb-1">Admin Panel</p>
              <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/draws/new" className="btn-gold px-5 py-2.5 text-sm flex items-center gap-2">
                <PlayCircle size={15} /> New Draw
              </Link>
              <Link href="/admin/verifications" className={`px-5 py-2.5 text-sm rounded-xl border transition-all flex items-center gap-2 ${
                pendingVerifications > 0
                  ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/15'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}>
                <ShieldCheck size={15} />
                {pendingVerifications > 0 ? `${pendingVerifications} Pending KYC` : 'Verifications'}
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsCards.map(({ label, value, icon: Icon, color, alert }) => (
              <div key={label} className={`glass-card p-5 ${alert ? 'border-yellow-500/25 animate-glow-pulse' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                       style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  {alert && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />}
                </div>
                <p className="font-mono text-3xl font-bold text-white">{value}</p>
                <p className="text-white/30 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Draws management */}
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <BarChart2 size={16} className="text-white/40" /> Draws
                </h2>
                <Link href="/admin/draws" className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1">
                  Manage <ChevronRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-white/4">
                {(data.draws as any[]).map((draw: any) => (
                  <div key={draw.id} className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white truncate">{draw.name}</p>
                      <p className="text-white/30 text-xs mt-0.5">{new Date(draw.drawDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-yellow-400 font-mono text-sm font-semibold">
                        {safeCurrency(draw.jackpotAmount)}
                      </p>
                      <p className="text-white/30 text-xs">{draw._count.tickets} tickets</p>
                    </div>
                    <span className={`badge ${
                      draw.status === 'LIVE' ? 'badge-live'
                      : draw.status === 'SCHEDULED' ? 'badge-scheduled'
                      : draw.status === 'COMPLETED' ? 'badge-completed' : 'badge-unverified'
                    }`}>{draw.status}</span>
                    <Link href={`/admin/draws/${draw.id}`}
                          className="text-white/20 hover:text-white/60 p-1">
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
                {(data.draws as any[]).length === 0 && (
                  <div className="p-8 text-center text-white/30 text-sm">No draws yet</div>
                )}
              </div>
            </div>

            {/* Recent players */}
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Users size={16} className="text-white/40" /> Recent Players
                </h2>
                <Link href="/admin/players" className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1">
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-white/4">
                {(data.recentUsers as any[]).map((u: any) => (
                  <div key={u.id} className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-semibold text-white/60">
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80">{u.firstName} {u.lastName}</p>
                      <p className="text-white/30 text-xs truncate">{u.email}</p>
                    </div>
                    <span className={`badge text-xs ${verBadge[u.verificationStatus] ?? ''}`}>
                      {u.verificationStatus === 'VERIFIED' ? '✓' : u.verificationStatus.slice(0,4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/admin/verifications', label: 'KYC Reviews',     icon: ShieldCheck, color: '#fbbf24' },
              { href: '/admin/players',       label: 'All Players',     icon: Users,       color: '#4361ee' },
              { href: '/admin/draws',         label: 'Manage Draws',    icon: PlayCircle,  color: '#2dc653' },
              { href: '/admin/winners',       label: 'Verify Winners',  icon: Trophy,      color: '#f59e0b' },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href}
                    className="glass-card p-5 hover:border-white/15 transition-all flex flex-col items-center gap-3 text-center group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                     style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
