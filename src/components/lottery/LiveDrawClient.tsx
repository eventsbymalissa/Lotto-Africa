'use client'
// src/components/lottery/LiveDrawClient.tsx
import { useState, useEffect, useRef } from 'react'
import { getCountdown, safeCurrency } from '@/lib/utils'
import { Shield, RefreshCw, Ticket, CheckCircle2 } from 'lucide-react'

interface Draw {
  id: string
  name: string
  drawDate: string
  jackpotAmount: string
  status: string
  winningNumbers: number[]
  bonusNumber: number | null
  drawSeed: string | null
  drawHash: string | null
  ticketPrice: number
  _count: { tickets: number }
}

interface Props {
  draw: Draw | null
  recentDraws: (Draw & { _count: { tickets: number; winners: number } })[]
}

const BALL_COLORS = [
  'ball-white', 'ball-blue', 'ball-red', 'ball-green', 'ball-purple', 'ball-gold'
]
function ballColor(n: number) {
  return BALL_COLORS[Math.floor((n - 1) / 9)] ?? 'ball-white'
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [cd, setCd] = useState(getCountdown(targetDate))
  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(targetDate)), 1000)
    return () => clearInterval(t)
  }, [targetDate])

  if (cd.isExpired) return <p className="text-red-400 font-semibold">Draw is now live!</p>

  return (
    <div className="flex justify-center gap-4">
      {[['Days', cd.days], ['Hours', cd.hours], ['Mins', cd.minutes], ['Secs', cd.seconds]].map(([label, val]) => (
        <div key={label as string} className="text-center">
          <div className="font-mono text-4xl font-bold tabular-nums text-white">
            {String(val).padStart(2, '0')}
          </div>
          <div className="text-white/30 text-xs uppercase tracking-wider mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}

function AnimatedBalls({ numbers, bonusNumber, onComplete }: {
  numbers: number[]
  bonusNumber: number | null
  onComplete?: () => void
}) {
  const [revealed, setRevealed] = useState<number[]>([])
  const [showBonus, setShowBonus] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    const allNums = [...numbers]
    const interval = setInterval(() => {
      if (indexRef.current < allNums.length) {
        setRevealed(prev => [...prev, allNums[indexRef.current]])
        indexRef.current++
      } else {
        clearInterval(interval)
        if (bonusNumber) setTimeout(() => setShowBonus(true), 500)
        if (onComplete) setTimeout(onComplete, bonusNumber ? 1200 : 400)
      }
    }, 800)
    return () => clearInterval(interval)
  }, [numbers, bonusNumber, onComplete])

  return (
    <div className="flex flex-wrap justify-center gap-3 my-6">
      {numbers.map((n, i) => (
        <div key={n}
             className={`lottery-ball ${ballColor(n)} transition-all duration-500 ${
               revealed.includes(n)
                 ? 'opacity-100 scale-100 animate-ball-fall'
                 : 'opacity-0 scale-50'
             }`}
             style={{ animationDelay: `${i * 0.1}s` }}>
          {n}
        </div>
      ))}
      {bonusNumber && (
        <>
          <div className="flex items-center text-white/20 text-sm font-bold">+</div>
          <div className={`lottery-ball ball-bonus transition-all duration-500 ${showBonus ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            {bonusNumber}
          </div>
        </>
      )}
    </div>
  )
}

export default function LiveDrawClient({ draw, recentDraws }: Props) {
  const [animating, setAnimating] = useState(false)
  const [showNumbers, setShowNumbers] = useState(false)

  const handleReveal = () => {
    setAnimating(true)
    setShowNumbers(true)
  }

  if (!draw) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-10 text-center">
          <p className="text-white/30 text-lg mb-2">No live or upcoming draw right now</p>
          <p className="text-white/20 text-sm">Check back soon for the next draw!</p>
        </div>

        {recentDraws.length > 0 && (
          <div>
            <h2 className="font-semibold text-white/60 text-sm uppercase tracking-wider mb-4">Recent Draws</h2>
            <div className="space-y-3">
              {recentDraws.map(d => (
                <div key={d.id} className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-white/30 text-xs">{new Date(d.drawDate).toLocaleDateString()}</p>
                    </div>
                    <p className="text-yellow-400 font-mono font-bold text-sm">
                      {safeCurrency(d.jackpotAmount)}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {d.winningNumbers.map(n => (
                      <div key={n} className={`lottery-ball ${ballColor(n)} w-9 h-9 text-sm`}>{n}</div>
                    ))}
                    {d.bonusNumber && <div className="lottery-ball ball-bonus w-9 h-9 text-sm">{d.bonusNumber}</div>}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-white/30">
                    <span>{d._count.tickets} tickets</span>
                    <span>·</span>
                    <span>{d._count.winners} winner{d._count.winners !== 1 ? 's' : ''}</span>
                    {d.drawHash && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-green-400/70">
                          <Shield size={10} /> Verified
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const isCompleted = draw.status === 'COMPLETED'
  const hasNumbers = draw.winningNumbers.length > 0

  return (
    <div className="space-y-6">
      {/* Main draw card */}
      <div className="glass-card p-8 text-center">
        {/* Status */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {draw.status === 'LIVE' && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          )}
          <span className={`badge ${draw.status === 'LIVE' ? 'badge-live' : draw.status === 'COMPLETED' ? 'badge-completed' : 'badge-scheduled'}`}>
            {draw.status === 'LIVE' ? '🔴 LIVE' : draw.status}
          </span>
        </div>

        <h2 className="font-display text-2xl font-bold mb-1">{draw.name}</h2>
        <p className="text-yellow-400 font-mono text-3xl font-bold mb-6">
          {safeCurrency(draw.jackpotAmount)}
        </p>

        {isCompleted && hasNumbers ? (
          <div>
            <p className="text-white/40 text-sm mb-4">Winning numbers</p>
            {showNumbers ? (
              <AnimatedBalls numbers={draw.winningNumbers} bonusNumber={draw.bonusNumber} />
            ) : (
              <div className="flex flex-wrap justify-center gap-3 my-6">
                {draw.winningNumbers.map(n => (
                  <div key={n} className={`lottery-ball ${ballColor(n)}`}>{n}</div>
                ))}
                {draw.bonusNumber && (
                  <>
                    <div className="flex items-center text-white/20 text-sm font-bold">+</div>
                    <div className="lottery-ball ball-bonus">{draw.bonusNumber}</div>
                  </>
                )}
              </div>
            )}
            {!showNumbers && (
              <button onClick={handleReveal} className="btn-gold px-8 py-3 flex items-center gap-2 mx-auto">
                <RefreshCw size={16} /> Reveal Numbers
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-white/40 text-sm mb-6">Draw in</p>
            <CountdownTimer targetDate={draw.drawDate} />
            <p className="text-white/20 text-xs mt-6">{draw._count.tickets} tickets purchased</p>
          </div>
        )}

        {/* Verification proof */}
        {isCompleted && draw.drawHash && (
          <div className="mt-6 p-4 rounded-xl bg-green-500/5 border border-green-500/15 text-left">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-green-400" />
              <p className="text-green-400 text-xs font-semibold uppercase tracking-wider">Cryptographically Verified</p>
            </div>
            <p className="text-white/30 text-xs leading-relaxed mb-2">
              This draw's result was generated from a pre-committed seed. Anyone can verify the numbers are authentic.
            </p>
            <div className="space-y-1">
              <div className="flex gap-2 text-xs">
                <span className="text-white/20 w-16 shrink-0">Hash</span>
                <span className="font-mono text-green-400/70 break-all">{draw.drawHash}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How verification works */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-blue-400" />
          <h3 className="font-semibold text-sm">How draw verification works</h3>
        </div>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Before the draw, we generate a random seed and publish its SHA-256 hash publicly' },
            { step: '2', text: 'After the draw, we reveal the seed - anyone can verify hash(seed) === published hash' },
            { step: '3', text: 'The winning numbers are deterministically generated from the seed using a public algorithm' },
            { step: '4', text: 'Winners receive a cryptographic proof that their ticket won, signed by our verification key' },
          ].map(({ step, text }) => (
            <div key={step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                {step}
              </div>
              <p className="text-white/40 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
