'use client'
// src/components/lottery/ResultsClient.tsx
import { useState } from 'react'
import { formatDate, safeCurrency } from '@/lib/utils'
import { Trophy, Shield, Search, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

interface Draw {
  id: string
  name: string
  drawDate: string
  jackpotAmount: string
  winningNumbers: number[]
  bonusNumber: number | null
  drawSeed: string | null
  drawHash: string | null
  ticketPrice: number
  _count: { tickets: number; winners: number }
  winners: { prizeTier: string; prizeAmount: string; verified: boolean }[]
}

interface UserTicket {
  id: string
  numbers: number[]
  drawId: string
  prizeTier: string | null
  prizeAmount: string | null
}

interface Props {
  draws: Draw[]
  userTickets: UserTicket[]
  isLoggedIn: boolean
}

const BALL_COLORS = ['ball-white', 'ball-blue', 'ball-red', 'ball-green', 'ball-purple', 'ball-gold']
function ballColor(n: number) {
  return BALL_COLORS[Math.floor((n - 1) / 9)] ?? 'ball-white'
}

function matchNumbers(ticket: number[], winning: number[]): number[] {
  return ticket.filter(n => winning.includes(n))
}

function DrawCard({ draw, userTickets }: { draw: Draw; userTickets: UserTicket[] }) {
  const [expanded, setExpanded] = useState(false)
  const myTickets = userTickets.filter(t => t.drawId === draw.id)

  const myWinningTickets = myTickets.filter(t => t.prizeTier)

  return (
    <div className={`glass-card overflow-hidden transition-all ${myWinningTickets.length > 0 ? 'border-yellow-500/30' : ''}`}>
      {/* Header row */}
      <div className="p-5 cursor-pointer hover:bg-white/2 transition-all" onClick={() => setExpanded(!expanded)}>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white">{draw.name}</h3>
              {myWinningTickets.length > 0 && (
                <span className="badge badge-verified text-xs">🏆 You won!</span>
              )}
            </div>
            <p className="text-white/40 text-sm">{formatDate(draw.drawDate)}</p>
          </div>

          {/* Balls preview */}
          <div className="flex gap-1.5 flex-wrap items-center">
            {draw.winningNumbers.map(n => (
              <div key={n} className={`lottery-ball ${ballColor(n)} w-9 h-9 text-xs`}>{n}</div>
            ))}
            {draw.bonusNumber && (
              <>
                <span className="text-white/20 text-xs font-bold mx-0.5">+</span>
                <div className="lottery-ball ball-bonus w-9 h-9 text-xs">{draw.bonusNumber}</div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-yellow-400 font-mono font-bold text-sm">{safeCurrency(draw.jackpotAmount)}</p>
              <p className="text-white/25 text-xs">{draw._count.winners} winner{draw._count.winners !== 1 ? 's' : ''}</p>
            </div>
            {draw.drawHash && <Shield size={14} className="text-green-400/60" title="Verified" />}
            {expanded ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5 p-5 space-y-5">
          {/* Prize breakdown */}
          {draw.winners.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/30 font-semibold mb-3">Prize Tiers Won</p>
              <div className="space-y-2">
                {draw.winners.map((w, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2">
                      <Trophy size={14} className="text-yellow-400/70" />
                      <span className="text-sm text-white/70">{w.prizeTier}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-yellow-400 text-sm font-semibold">
                        {safeCurrency(w.prizeAmount)}
                      </span>
                      {w.verified
                        ? <CheckCircle2 size={13} className="text-green-400" title="Verified" />
                        : <span className="text-yellow-400/50 text-xs">Pending</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My tickets for this draw */}
          {myTickets.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/30 font-semibold mb-3">Your Tickets</p>
              <div className="space-y-2">
                {myTickets.map(ticket => {
                  const matches = matchNumbers(ticket.numbers, draw.winningNumbers)
                  const won = !!ticket.prizeTier
                  return (
                    <div key={ticket.id} className={`p-3 rounded-xl border flex flex-wrap items-center gap-3 ${
                      won ? 'border-yellow-500/25 bg-yellow-500/5' : 'border-white/5 bg-white/2'
                    }`}>
                      <div className="flex gap-1.5 flex-wrap flex-1">
                        {ticket.numbers.map(n => {
                          const isMatch = matches.includes(n)
                          return (
                            <div key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-semibold transition-all ${
                              isMatch
                                ? `${ballColor(n)} lottery-ball`
                                : 'bg-white/5 border border-white/10 text-white/30'
                            }`}>
                              {n}
                            </div>
                          )
                        })}
                      </div>
                      <div className="text-right">
                        {won ? (
                          <span className="badge badge-verified text-xs">🏆 {ticket.prizeTier}</span>
                        ) : (
                          <span className="text-white/25 text-xs">{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Verification proof */}
          {draw.drawHash && (
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/15">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={13} className="text-green-400" />
                <p className="text-green-400 text-xs font-semibold uppercase tracking-wider">Cryptographic Proof</p>
              </div>
              <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs">
                <span className="text-white/25">Hash</span>
                <span className="font-mono text-green-400/60 break-all">{draw.drawHash}</span>
                {draw.drawSeed && (
                  <>
                    <span className="text-white/25">Seed</span>
                    <span className="font-mono text-green-400/60 break-all">{draw.drawSeed}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-4 text-xs text-white/30">
            <span>{draw._count.tickets} total tickets</span>
            <span>·</span>
            <span>{draw._count.winners} winners</span>
            <span>·</span>
            <span>{draw.ticketPrice} tokens/ticket</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ResultsClient({ draws, userTickets, isLoggedIn }: Props) {
  const [search, setSearch] = useState('')

  const filtered = draws.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.drawDate.includes(search)
  )

  const myWins = userTickets.filter(t => t.prizeTier)

  if (draws.length === 0) {
    return (
      <div className="glass-card p-16 text-center">
        <Trophy size={40} className="text-white/10 mx-auto mb-4" />
        <p className="text-white/40 text-lg">No completed draws yet</p>
        <p className="text-white/20 text-sm mt-2">Results will appear here after each draw</p>
        <Link href="/buy-tickets" className="btn-gold px-6 py-3 inline-block mt-6">Play Now</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* My wins banner */}
      {myWins.length > 0 && (
        <div className="glass-card p-5 border-yellow-500/25 glow-gold flex items-center gap-4">
          <Trophy size={24} className="text-yellow-400 shrink-0" />
          <div>
            <p className="font-semibold text-yellow-400">You have {myWins.length} winning ticket{myWins.length > 1 ? 's' : ''}!</p>
            <p className="text-white/40 text-sm">Expand the draw below to view your winnings.</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search draws..."
          className="lottery-input pl-10"
        />
      </div>

      {!isLoggedIn && (
        <div className="p-4 rounded-xl bg-blue-500/8 border border-blue-500/15 text-center text-sm text-white/50">
          <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link> to check your tickets against results
        </div>
      )}

      {/* Draw list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card p-8 text-center text-white/30">No draws match your search</div>
        ) : (
          filtered.map(draw => (
            <DrawCard key={draw.id} draw={draw} userTickets={userTickets} />
          ))
        )}
      </div>
    </div>
  )
}
