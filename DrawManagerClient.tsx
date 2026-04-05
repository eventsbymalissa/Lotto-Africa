'use client'
// src/components/admin/DrawManagerClient.tsx
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { PlayCircle, Loader2, Shield, Trophy, Ticket, Users, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

interface DrawTicket {
  id: string
  numbers: number[]
  tokenCost: number
  createdAt: string
  user: { firstName: string; lastName: string; email: string }
  prizeTier: string | null
}

interface DrawWinner {
  id: string
  prizeTier: string
  prizeAmount: string
  verified: boolean
  verifiedAt: string | null
  user: { firstName: string; lastName: string; email: string }
}

interface Draw {
  id: string
  name: string
  status: string
  drawDate: string
  jackpotAmount: string
  winningNumbers: number[]
  bonusNumber: number | null
  drawSeed: string | null
  drawHash: string | null
  ticketPrice: number
  tickets: DrawTicket[]
  winners: DrawWinner[]
  _count: { tickets: number; winners: number }
}

const BALL_COLORS = ['ball-white', 'ball-blue', 'ball-red', 'ball-green', 'ball-purple', 'ball-gold']
function ballColor(n: number) {
  return BALL_COLORS[Math.floor((n - 1) / 9)] ?? 'ball-white'
}

export default function DrawManagerClient({ draw: initialDraw }: { draw: Draw }) {
  const [draw, setDraw] = useState(initialDraw)
  const [triggering, setTriggering] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'winners'>('overview')
  const [confirmTrigger, setConfirmTrigger] = useState(false)

  const handleTriggerDraw = async () => {
    if (!confirmTrigger) { setConfirmTrigger(true); return }
    setTriggering(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/draws/${draw.id}/trigger`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to trigger draw'); return }
      setDraw(data.data)
      setConfirmTrigger(false)
    } catch {
      setError('Request failed')
    } finally {
      setTriggering(false)
    }
  }

  const handleVerifyWinner = async (winnerId: string) => {
    setVerifying(winnerId)
    setError('')
    try {
      const res = await fetch(`/api/admin/winners/${winnerId}/verify`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to verify winner'); return }
      setDraw(prev => ({
        ...prev,
        winners: prev.winners.map(w => w.id === winnerId ? { ...w, verified: true, verifiedAt: new Date().toISOString() } : w),
      }))
    } catch {
      setError('Request failed')
    } finally {
      setVerifying(null)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'tickets', label: `Tickets (${draw._count.tickets})`, icon: Ticket },
    { id: 'winners', label: `Winners (${draw._count.winners})`, icon: Trophy },
  ] as const

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <XCircle size={16} /> {error}
        </div>
      )}

      {/* Status + Trigger */}
      {draw.status !== 'COMPLETED' && draw.status !== 'CANCELLED' && (
        <div className={`glass-card p-6 border ${confirmTrigger ? 'border-red-500/30' : ''}`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold mb-1">
                {draw.status === 'SCHEDULED' ? 'Draw is scheduled' : '🔴 Draw is LIVE'}
              </p>
              <p className="text-white/40 text-sm">
                {draw.status === 'SCHEDULED'
                  ? `${draw._count.tickets} tickets sold. Trigger the draw to generate winning numbers.`
                  : 'Draw is in progress. Trigger to finalize results.'}
              </p>
              {confirmTrigger && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                  <AlertTriangle size={14} /> This will permanently finalize the draw. Click again to confirm.
                </p>
              )}
            </div>
            <button
              onClick={handleTriggerDraw}
              disabled={triggering}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                confirmTrigger
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'btn-gold'
              }`}
            >
              {triggering ? <><Loader2 size={16} className="animate-spin" /> Running draw...</>
                : confirmTrigger ? <><AlertTriangle size={16} /> Confirm & Run Draw</>
                : <><PlayCircle size={16} /> Trigger Draw</>}
            </button>
            {confirmTrigger && (
              <button onClick={() => setConfirmTrigger(false)} className="text-white/30 hover:text-white/60 text-sm">Cancel</button>
            )}
          </div>
        </div>
      )}

      {/* Winning numbers display */}
      {draw.status === 'COMPLETED' && draw.winningNumbers.length > 0 && (
        <div className="glass-card p-6 text-center border-green-500/15">
          <p className="text-xs uppercase tracking-wider text-white/30 mb-4">Winning Numbers</p>
          <div className="flex justify-center gap-3 flex-wrap mb-4">
            {draw.winningNumbers.map(n => (
              <div key={n} className={`lottery-ball ${ballColor(n)}`}>{n}</div>
            ))}
            {draw.bonusNumber && (
              <>
                <span className="flex items-center text-white/20 font-bold">+</span>
                <div className="lottery-ball ball-bonus">{draw.bonusNumber}</div>
              </>
            )}
          </div>
          {draw.drawHash && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <Shield size={13} className="text-green-400" />
              <span className="text-green-400 text-xs font-semibold">Cryptographically Verified</span>
            </div>
          )}
          {draw.drawSeed && (
            <div className="mt-4 p-3 rounded-xl bg-white/3 text-left text-xs space-y-1">
              <div className="grid grid-cols-[60px,1fr] gap-2">
                <span className="text-white/25">Seed</span>
                <span className="font-mono text-green-400/60 break-all">{draw.drawSeed}</span>
                <span className="text-white/25">Hash</span>
                <span className="font-mono text-green-400/60 break-all">{draw.drawHash}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === id ? 'bg-white/8 text-white' : 'text-white/40 hover:text-white/60'
                  }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="glass-card p-6 space-y-4">
          {[
            { label: 'Status', value: draw.status },
            { label: 'Jackpot', value: formatCurrency(BigInt(draw.jackpotAmount)) },
            { label: 'Ticket Price', value: `${draw.ticketPrice} token${draw.ticketPrice > 1 ? 's' : ''}` },
            { label: 'Total Tickets', value: draw._count.tickets.toString() },
            { label: 'Winners', value: draw._count.winners.toString() },
            { label: 'Draw Date', value: new Date(draw.drawDate).toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-white/4 last:border-0">
              <span className="text-white/40 text-sm">{label}</span>
              <span className="text-white/80 text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tickets tab */}
      {activeTab === 'tickets' && (
        <div className="glass-card overflow-hidden">
          {draw.tickets.length === 0 ? (
            <div className="p-10 text-center text-white/30">No tickets sold yet</div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto divide-y divide-white/4">
              {draw.tickets.map(ticket => (
                <div key={ticket.id} className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/50">
                    {ticket.user.firstName[0]}{ticket.user.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80">{ticket.user.firstName} {ticket.user.lastName}</p>
                    <div className="flex gap-1 mt-1">
                      {ticket.numbers.map(n => (
                        <span key={n} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono ${
                          draw.winningNumbers.includes(n)
                            ? `lottery-ball ${ballColor(n)}`
                            : 'bg-white/5 text-white/30'
                        }`}>{n}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {ticket.prizeTier
                      ? <span className="badge badge-verified text-xs">{ticket.prizeTier}</span>
                      : draw.status === 'COMPLETED'
                        ? <span className="text-white/20 text-xs">No win</span>
                        : <span className="text-white/20 text-xs">{ticket.tokenCost} tkn</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Winners tab */}
      {activeTab === 'winners' && (
        <div className="space-y-3">
          {draw.winners.length === 0 ? (
            <div className="glass-card p-10 text-center text-white/30">
              {draw.status === 'COMPLETED' ? 'No winners for this draw' : 'Winners will appear after the draw'}
            </div>
          ) : (
            draw.winners.map(winner => (
              <div key={winner.id} className={`glass-card p-5 flex flex-wrap items-center gap-4 border ${
                winner.verified ? 'border-green-500/15' : 'border-yellow-500/15'
              }`}>
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-sm font-bold text-yellow-400">
                  {winner.user.firstName[0]}{winner.user.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{winner.user.firstName} {winner.user.lastName}</p>
                  <p className="text-white/40 text-sm">{winner.user.email}</p>
                  <p className="text-yellow-400 text-xs mt-1 font-medium">{winner.prizeTier}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-yellow-400 font-bold">{formatCurrency(BigInt(winner.prizeAmount))}</p>
                  {winner.verified ? (
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <CheckCircle2 size={12} className="text-green-400" />
                      <span className="text-green-400 text-xs">Verified</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleVerifyWinner(winner.id)}
                      disabled={verifying === winner.id}
                      className="mt-2 flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20 transition-all"
                    >
                      {verifying === winner.id
                        ? <><Loader2 size={11} className="animate-spin" /> Verifying...</>
                        : <><Shield size={11} /> Verify Winner</>}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
