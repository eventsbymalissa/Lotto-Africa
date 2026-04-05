'use client'
// src/components/lottery/TicketPickerClient.tsx
import { useState } from 'react'
import { Zap, RefreshCw, Ticket, Coins, CheckCircle2, Loader2, X } from 'lucide-react'

interface Props {
  drawId: string
  ticketPrice: number
  userTokenBalance: number
}

const TOTAL_NUMBERS = 49
const PICK_COUNT = 6

function QuickPick(): number[] {
  const pool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, PICK_COUNT).sort((a, b) => a - b)
}

const BALL_COLORS = [
  'ball-white', 'ball-blue', 'ball-red', 'ball-green', 'ball-purple', 'ball-gold',
]
function ballColor(n: number): string {
  return BALL_COLORS[Math.floor((n - 1) / Math.ceil(TOTAL_NUMBERS / BALL_COLORS.length))] ?? 'ball-white'
}

export default function TicketPickerClient({ drawId, ticketPrice, userTokenBalance }: Props) {
  const [selected, setSelected] = useState<number[]>([])
  const [tickets, setTickets] = useState<number[][]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const toggleNumber = (n: number) => {
    setSelected(prev => {
      if (prev.includes(n)) return prev.filter(x => x !== n)
      if (prev.length >= PICK_COUNT) return prev
      return [...prev, n].sort((a, b) => a - b)
    })
  }

  const addTicket = () => {
    if (selected.length !== PICK_COUNT) return
    if (tickets.length >= 10) return
    setTickets(prev => [...prev, selected])
    setSelected([])
  }

  const removeTicket = (i: number) => setTickets(prev => prev.filter((_, idx) => idx !== i))

  const quickPick = () => {
    const nums = QuickPick()
    setTickets(prev => [...prev, nums].slice(0, 10))
    setSelected([])
  }

  const totalCost = tickets.length * ticketPrice
  const canAfford = totalCost <= userTokenBalance

  const handlePurchase = async () => {
    if (!tickets.length || !canAfford) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawId, tickets }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Purchase failed'); return }
      setSuccess(true)
      setTickets([])
      setSelected([])
    } catch {
      setError('Purchase failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
        <h3 className="font-display text-xl font-bold text-green-400 mb-2">Tickets Purchased!</h3>
        <p className="text-white/50 mb-6">Good luck! You can view your tickets in your dashboard.</p>
        <button onClick={() => setSuccess(false)} className="btn-ghost px-6 py-2">Buy More</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pick instruction */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm">
            Pick <span className="text-yellow-400 font-semibold">{PICK_COUNT}</span> numbers from 1-{TOTAL_NUMBERS}
            {selected.length > 0 && <span className="text-white/30"> ({selected.length}/{PICK_COUNT} selected)</span>}
          </p>
        </div>
        <button onClick={quickPick} disabled={tickets.length >= 10}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/3 hover:bg-white/8 text-white/60 hover:text-white text-sm transition-all disabled:opacity-40">
          <Zap size={14} /> Quick Pick
        </button>
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-2">
        {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => toggleNumber(n)}
                  className={`number-cell ${selected.includes(n) ? 'selected' : ''} ${
                    selected.length >= PICK_COUNT && !selected.includes(n) ? 'opacity-30 cursor-not-allowed' : ''
                  }`}>
            {n}
          </button>
        ))}
      </div>

      {/* Add ticket button */}
      {selected.length === PICK_COUNT && (
        <button onClick={addTicket}
                className="w-full py-3 rounded-xl border border-green-500/30 bg-green-500/8 text-green-400 font-medium text-sm hover:bg-green-500/15 transition-all flex items-center justify-center gap-2">
          <Ticket size={16} /> Add these numbers as a ticket
        </button>
      )}

      {/* Queued tickets */}
      {tickets.length > 0 && (
        <div className="space-y-3">
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Your tickets ({tickets.length})</p>
          {tickets.map((ticket, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
              <span className="text-white/30 text-xs font-mono w-6">#{i + 1}</span>
              <div className="flex gap-1.5 flex-wrap flex-1">
                {ticket.map(n => (
                  <div key={n} className={`lottery-ball ${ballColor(n)} w-8 h-8 text-xs`}>{n}</div>
                ))}
              </div>
              <button onClick={() => removeTicket(i)}
                      className="text-white/20 hover:text-red-400 transition-colors p-1">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Purchase bar */}
      {tickets.length > 0 && (
        <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">{tickets.length} ticket{tickets.length > 1 ? 's' : ''} × {ticketPrice} tokens</span>
            <div className="flex items-center gap-1.5">
              <Coins size={14} className="text-yellow-400" />
              <span className={`font-mono font-bold ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>{totalCost}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>Your balance</span>
            <span className="font-mono">{userTokenBalance} tokens</span>
          </div>
          {!canAfford && (
            <p className="text-red-400 text-xs">Insufficient tokens. <a href="/player/tokens" className="underline">Buy more</a></p>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button onClick={handlePurchase} disabled={loading || !canAfford}
                  className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                     : <><Ticket size={16} /> Buy {tickets.length} Ticket{tickets.length > 1 ? 's' : ''} for {totalCost} Tokens</>}
          </button>

          <div className="flex items-center justify-between">
            <button onClick={() => { setTickets([]); setSelected([]) }}
                    className="flex items-center gap-1.5 text-white/25 hover:text-white/50 text-xs transition-colors">
              <RefreshCw size={11} /> Clear all
            </button>
            <span className="text-white/20 text-xs">Max 10 tickets per draw</span>
          </div>
        </div>
      )}
    </div>
  )
}
