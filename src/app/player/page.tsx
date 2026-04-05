// src/app/player/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { serializeBigInt, safeCurrency } from '@/lib/utils'
import { Coins, Ticket, Trophy, Shield, AlertCircle, ChevronRight, CheckCircle2, Clock, XCircle } from 'lucide-react'

export default async function PlayerDashboard() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [user, tickets, transactions, winners] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        firstName: true, lastName: true, email: true, phone: true,
        tokenBalance: true, verificationStatus: true, createdAt: true,
      },
    }),
    prisma.ticket.findMany({
      where: { userId: session.userId },
      include: { draw: { select: { name: true, drawDate: true, status: true, winningNumbers: true, bonusNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.winner.findMany({
      where: { userId: session.userId },
      include: { draw: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!user) redirect('/login')

  const data = serializeBigInt({ tickets, transactions, winners })

  const verificationColors: Record<string, string> = {
    VERIFIED: 'badge-verified', PENDING: 'badge-pending',
    UNVERIFIED: 'badge-unverified', REJECTED: 'badge-rejected',
  }

  const statCards = [
    { label: 'Token Balance', value: user.tokenBalance, icon: Coins, color: '#f59e0b', href: '/player/tokens', suffix: 'tokens' },
    { label: 'Tickets Bought', value: tickets.length, icon: Ticket, color: '#4361ee', suffix: 'total' },
    { label: 'Total Wins', value: (data.winners as any[]).length, icon: Trophy, color: '#2dc653', suffix: 'wins' },
    { label: 'Account Status', value: user.verificationStatus, icon: Shield, color: '#7c3aed', isStatus: true },
  ]

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} tokenBalance={user.tokenBalance} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Welcome back, {user.firstName}!</h1>
              <p className="text-white/40 mt-1">{user.email}</p>
            </div>
            <Link href="/buy-tickets" className="btn-gold px-6 py-3 flex items-center gap-2">
              <Ticket size={16} /> Buy Tickets
            </Link>
          </div>

          {/* Verification alert */}
          {user.verificationStatus !== 'VERIFIED' && (
            <div className={`mb-6 p-5 rounded-2xl flex items-start gap-3 border ${
              user.verificationStatus === 'PENDING'
                ? 'bg-yellow-500/8 border-yellow-500/20'
                : user.verificationStatus === 'REJECTED'
                ? 'bg-red-500/8 border-red-500/20'
                : 'bg-blue-500/8 border-blue-500/20'
            }`}>
              {user.verificationStatus === 'PENDING'
                ? <Clock size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                : user.verificationStatus === 'REJECTED'
                ? <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                : <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  user.verificationStatus === 'PENDING' ? 'text-yellow-400'
                  : user.verificationStatus === 'REJECTED' ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {user.verificationStatus === 'PENDING' ? 'Verification in progress'
                   : user.verificationStatus === 'REJECTED' ? 'Verification rejected'
                   : 'Identity verification required'}
                </p>
                <p className="text-white/40 text-sm mt-0.5">
                  {user.verificationStatus === 'PENDING'
                    ? 'Your documents are being reviewed. You will be notified within 1-2 business days.'
                    : user.verificationStatus === 'REJECTED'
                    ? 'Your verification was rejected. Please re-submit with a valid document.'
                    : 'Verify your identity to start buying tickets and playing.'}
                </p>
              </div>
              {user.verificationStatus !== 'PENDING' && (
                <Link href="/verify-id" className="shrink-0 text-sm font-medium px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-all">
                  {user.verificationStatus === 'REJECTED' ? 'Re-submit' : 'Verify Now'}
                </Link>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map(({ label, value, icon: Icon, color, href, suffix, isStatus }) => (
              <div key={label} className={`glass-card p-5 ${href ? 'hover:border-white/15 transition-all cursor-pointer' : ''}`}
                   onClick={href ? () => window.location.href = href : undefined}>
                <div className="flex items-center justify-between mb-3">
                  <Icon size={16} style={{ color }} />
                  {href && <ChevronRight size={14} className="text-white/20" />}
                </div>
                {isStatus ? (
                  <span className={`badge ${verificationColors[value as string] ?? 'badge-unverified'}`}>{value}</span>
                ) : (
                  <p className="font-mono text-2xl font-bold text-white">{typeof value === 'number' ? value : value}</p>
                )}
                <p className="text-white/30 text-xs mt-1">{label}{suffix && !isStatus ? ` · ${suffix}` : ''}</p>
              </div>
            ))}
          </div>

          {/* Wins highlight */}
          {(data.winners as any[]).length > 0 && (
            <div className="glass-card p-6 mb-8 glow-gold border-yellow-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} className="text-yellow-400" />
                <h2 className="font-semibold">Your Wins 🎉</h2>
              </div>
              <div className="space-y-3">
                {(data.winners as any[]).map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                    <div>
                      <p className="text-yellow-400 font-semibold text-sm">{w.prizeTier}</p>
                      <p className="text-white/40 text-xs">{w.draw?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-mono font-bold">{safeCurrency(w.prizeAmount)}</p>
                      <p className={`text-xs mt-0.5 ${w.verified ? 'text-green-400' : 'text-yellow-400/60'}`}>
                        {w.verified ? '✓ Verified' : 'Pending verification'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent tickets */}
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Ticket size={16} className="text-white/40" /> My Tickets
                </h2>
                <span className="text-white/30 text-xs">{tickets.length} total</span>
              </div>
              {(data.tickets as any[]).length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-white/30 text-sm">No tickets yet.</p>
                  <Link href="/buy-tickets" className="text-yellow-400 text-sm hover:underline mt-2 inline-block">Buy your first ticket →</Link>
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                  {(data.tickets as any[]).slice(0, 10).map((t: any) => (
                    <div key={t.id} className="p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/60 text-xs mb-1.5 truncate">{t.draw?.name}</p>
                        <div className="flex gap-1 flex-wrap">
                          {t.numbers.map((n: number) => (
                            <span key={n} className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-xs font-mono">{n}</span>
                          ))}
                        </div>
                      </div>
                      <span className={`badge text-xs ${
                        t.draw?.status === 'COMPLETED' ? (t.prizeTier ? 'badge-verified' : 'badge-unverified')
                        : t.draw?.status === 'LIVE' ? 'badge-live' : 'badge-scheduled'
                      }`}>
                        {t.draw?.status === 'COMPLETED' ? (t.prizeTier ?? 'No win') : t.draw?.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transaction history */}
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-semibold">Transaction History</h2>
                <span className="text-white/30 text-xs">{transactions.length} total</span>
              </div>
              {(data.transactions as any[]).length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-white/30 text-sm">No transactions yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                  {(data.transactions as any[]).map((tx: any) => (
                    <div key={tx.id} className="p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">{tx.description}</p>
                        <p className="text-white/30 text-xs mt-0.5">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {tx.tokenAmount !== null && (
                          <p className={`font-mono text-sm font-semibold ${tx.tokenAmount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.tokenAmount > 0 ? '+' : ''}{tx.tokenAmount} tkn
                          </p>
                        )}
                        {Number(tx.amount) > 0 && (
                          <p className="text-white/40 text-xs">{safeCurrency(tx.amount)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
