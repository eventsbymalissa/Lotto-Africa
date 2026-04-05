// src/app/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import Navbar from '@/components/ui/Navbar'
import HomeClient from '@/components/lottery/HomeClient'
import { Trophy, Shield, Zap, Users, ChevronRight, Star } from 'lucide-react'

export const revalidate = 60

async function getData() {
  const [draws, session] = await Promise.all([
    prisma.draw.findMany({
      where: { status: { in: ['SCHEDULED', 'LIVE', 'COMPLETED'] } },
      orderBy: { drawDate: 'asc' },
      take: 5,
    }),
    getSession(),
  ])

  let tokenBalance = 0
  if (session) {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { tokenBalance: true } })
    tokenBalance = user?.tokenBalance ?? 0
  }

  const upcomingDraw = draws.find(d => d.status === 'SCHEDULED' || d.status === 'LIVE') ?? null
  const recentResults = draws.filter(d => d.status === 'COMPLETED').slice(0, 3)
  const totalPlayers = await prisma.user.count({ where: { role: 'PLAYER' } })
  const totalWinners = await prisma.winner.count()

  return {
    upcomingDraw: upcomingDraw ? {
      ...upcomingDraw,
      jackpotAmount: upcomingDraw.jackpotAmount.toString(),
    } : null,
    recentResults: recentResults.map(d => ({
      ...d,
      jackpotAmount: d.jackpotAmount.toString(),
    })),
    session,
    tokenBalance,
    totalPlayers,
    totalWinners,
  }
}

export default async function HomePage() {
  const { upcomingDraw, recentResults, session, tokenBalance, totalPlayers, totalWinners } = await getData()

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} tokenBalance={tokenBalance} />

      {/* Hero */}
      <section className="relative pt-24 pb-16 px-4 text-center overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
             style={{ background: 'radial-gradient(circle, #7c3aed 0%, #1a0a3d 60%, transparent 100%)' }} />
        <div className="absolute top-40 left-1/4 w-48 h-48 rounded-full opacity-10 blur-2xl pointer-events-none"
             style={{ background: '#f59e0b' }} />
        <div className="absolute top-40 right-1/4 w-48 h-48 rounded-full opacity-10 blur-2xl pointer-events-none"
             style={{ background: '#4361ee' }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-yellow-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Draws Every Week - Verified by Cryptography
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Your Fortune
            <br />
            <span className="text-gold-shimmer">Awaits</span>
          </h1>

          <p className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The most transparent lottery platform in the world. Every draw is cryptographically verified - anyone can check the results are fair.
          </p>

          {/* Jackpot display */}
          {upcomingDraw && (
            <div className="glass-card p-8 mb-10 max-w-2xl mx-auto glow-gold">
              <p className="text-white/50 text-sm uppercase tracking-widest mb-2">Current Jackpot</p>
              <p className="font-display text-5xl sm:text-6xl font-bold text-gold-shimmer mb-1">
                {formatCurrency(BigInt(upcomingDraw.jackpotAmount))}
              </p>
              <p className="text-white/40 text-sm mb-6">{upcomingDraw.name}</p>
              <HomeClient drawDate={upcomingDraw.drawDate.toString()} />
            </div>
          )}

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/buy-tickets" className="btn-gold text-base px-8 py-4 flex items-center gap-2">
              Play Now <ChevronRight size={18} />
            </Link>
            <Link href="/results" className="btn-ghost text-base px-8 py-4">
              View Results
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 py-6 px-4"
               style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Players', value: totalPlayers.toLocaleString() },
            { label: 'Winners', value: totalWinners.toLocaleString() },
            { label: 'Jackpot', value: upcomingDraw ? formatCurrency(BigInt(upcomingDraw.jackpotAmount)) : '$--' },
            { label: 'Verified Draws', value: '100%' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-display text-2xl font-bold text-gold-400" style={{ color: '#fbbf24' }}>{value}</p>
              <p className="text-white/40 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-4">Why MegaWin?</h2>
          <p className="text-white/40 text-center mb-12">Fair. Transparent. Proven.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Cryptographic Verification',
                desc: 'Every draw result is mathematically provable. Seeds are committed before the draw and revealed after.',
                color: '#4361ee',
              },
              {
                icon: Trophy,
                title: 'Instant Payouts',
                desc: 'Winners are automatically detected and payouts initiated within minutes of the draw.',
                color: '#fbbf24',
              },
              {
                icon: Users,
                title: 'ID-Verified Players',
                desc: 'All players complete identity verification, ensuring legitimate winners and preventing fraud.',
                color: '#2dc653',
              },
              {
                icon: Zap,
                title: 'Token System',
                desc: 'Purchase tokens once, use them to play any game. Simple, transparent, and fair.',
                color: '#f59e0b',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass-card p-6 hover:border-white/15 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                     style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <section className="py-12 px-4 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold">Recent Results</h2>
              <Link href="/results" className="text-sm text-yellow-400/70 hover:text-yellow-400 flex items-center gap-1">
                All results <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-4">
              {recentResults.map(draw => (
                <div key={draw.id} className="glass-card p-5 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{draw.name}</p>
                    <p className="text-white/40 text-sm">{formatDate(draw.drawDate)}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {draw.winningNumbers.map((n, i) => (
                      <div key={i} className="lottery-ball ball-white w-9 h-9 text-sm">{n}</div>
                    ))}
                    {draw.bonusNumber && (
                      <div className="lottery-ball ball-bonus w-9 h-9 text-sm">{draw.bonusNumber}</div>
                    )}
                  </div>
                  <span className="badge badge-completed">Completed</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {!session && (
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto glass-card p-10 text-center glow-gold">
            <Star className="text-yellow-400 mx-auto mb-4" size={32} />
            <h2 className="font-display text-3xl font-bold mb-4">Ready to Win?</h2>
            <p className="text-white/50 mb-8">Join thousands of verified players and try your luck today.</p>
            <Link href="/register" className="btn-gold text-base px-10 py-4 inline-block">
              Create Free Account
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4 text-center text-white/25 text-sm">
        <p className="font-display text-lg text-white/40 mb-2">MegaWin</p>
        <p>© 2025 MegaWin Lottery. All draws are cryptographically verified. Play responsibly.</p>
      </footer>
    </div>
  )
}
