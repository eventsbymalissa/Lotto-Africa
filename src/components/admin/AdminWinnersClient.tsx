'use client'
// src/components/admin/AdminWinnersClient.tsx
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Shield, CheckCircle2, Clock, Loader2, ChevronDown, ChevronUp, Trophy, AlertTriangle } from 'lucide-react'

interface Winner {
  id: string
  prizeTier: string
  prizeAmount: string
  verified: boolean
  verifiedAt: string | null
  claimDeadline: string
  verificationProof: string | null
  user: { firstName: string; lastName: string; email: string; verificationStatus: string }
  draw: { name: string; drawDate: string }
  ticket: { numbers: number[] }
}

export default function AdminWinnersClient({ winners: initial, adminId }: { winners: Winner[]; adminId: string }) {
  const [winners, setWinners] = useState(initial)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleVerify = async (winnerId: string) => {
    setVerifying(winnerId)
    setErrors(prev => ({ ...prev, [winnerId]: '' }))
    try {
      const res = await fetch(`/api/admin/winners/${winnerId}/verify`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setErrors(prev => ({ ...prev, [winnerId]: data.error ?? 'Verification failed' }))
        return
      }
      setWinners(prev =>
        prev.map(w => w.id === winnerId ? { ...w, verified: true, verifiedAt: new Date().toISOString() } : w)
      )
    } catch {
      setErrors(prev => ({ ...prev, [winnerId]: 'Request failed' }))
    } finally {
      setVerifying(null)
    }
  }

  const pending = winners.filter(w => !w.verified)
  const verified = winners.filter(w => w.verified)

  const WinnerCard = ({ winner }: { winner: Winner }) => {
    const isExpanded = expanded === winner.id
    const error = errors[winner.id]
    const proof = winner.verificationProof ? JSON.parse(winner.verificationProof) : null
    const idVerified = winner.user.verificationStatus === 'VERIFIED'

    return (
      <div className={`glass-card overflow-hidden border ${winner.verified ? 'border-green-500/10' : 'border-yellow-500/15'}`}>
        <div className="p-5 flex flex-wrap items-center gap-4 cursor-pointer hover:bg-white/2 transition-all"
             onClick={() => setExpanded(isExpanded ? null : winner.id)}>
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center font-bold text-yellow-400">
            {winner.user.firstName[0]}{winner.user.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">{winner.user.firstName} {winner.user.lastName}</p>
            <p className="text-white/40 text-sm">{winner.user.email}</p>
          </div>
          <div className="text-center">
            <p className="text-yellow-400 font-mono font-bold">{formatCurrency(BigInt(winner.prizeAmount))}</p>
            <p className="text-white/30 text-xs">{winner.prizeTier}</p>
          </div>
          <div>
            {winner.verified
              ? <span className="badge badge-verified text-xs flex items-center gap-1"><CheckCircle2 size={10} /> Verified</span>
              : <span className="badge badge-pending text-xs flex items-center gap-1"><Clock size={10} /> Pending</span>}
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
        </div>

        {isExpanded && (
          <div className="border-t border-white/5 p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-white/25 font-semibold">Draw Info</p>
                <p className="text-white/50">Draw: <span className="text-white/70">{winner.draw.name}</span></p>
                <p className="text-white/50">Date: <span className="text-white/70">{new Date(winner.draw.drawDate).toLocaleDateString()}</span></p>
                <p className="text-white/50">Claim by: <span className="text-white/70">{new Date(winner.claimDeadline).toLocaleDateString()}</span></p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-white/25 font-semibold">Player Identity</p>
                <div className="flex items-center gap-2">
                  {idVerified
                    ? <><CheckCircle2 size={14} className="text-green-400" /> <span className="text-green-400 text-sm">ID Verified</span></>
                    : <><AlertTriangle size={14} className="text-red-400" /> <span className="text-red-400 text-sm">ID NOT Verified &mdash; Cannot pay out</span></>}
                </div>
                <p className="text-white/50">Ticket numbers:</p>
                <div className="flex gap-1 flex-wrap">
                  {winner.ticket.numbers.map(n => (
                    <span key={n} className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-xs font-mono">{n}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Cryptographic proof */}
            {proof && (
              <div className="p-4 rounded-xl bg-white/3 border border-white/6 space-y-2">
                <p className="text-xs uppercase tracking-wider text-white/25 font-semibold flex items-center gap-1.5">
                  <Shield size={11} /> Cryptographic Proof
                </p>
                <div className="grid grid-cols-[80px,1fr] gap-x-3 gap-y-1 text-xs">
                  <span className="text-white/25">Proof hash</span>
                  <span className="font-mono text-green-400/60 break-all">{proof.proofHash}</span>
                  <span className="text-white/25">Draw seed</span>
                  <span className="font-mono text-green-400/60 break-all">{proof.drawSeed?.slice(0, 32)}...</span>
                  <span className="text-white/25">Prize tier</span>
                  <span className="text-white/60">{proof.prizeTier}</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{error}</p>
            )}

            {!winner.verified && (
              <button
                onClick={() => handleVerify(winner.id)}
                disabled={verifying === winner.id || !idVerified}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {verifying === winner.id
                  ? <><Loader2 size={15} className="animate-spin" /> Verifying & recording payout...</>
                  : <><Shield size={15} /> Verify Winner & Confirm Payout</>}
              </button>
            )}

            {winner.verified && winner.verifiedAt && (
              <p className="text-green-400/60 text-xs text-center">
                ✓ Verified on {new Date(winner.verifiedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-yellow-400/60 font-semibold flex items-center gap-2">
            <Clock size={12} /> Pending Verification ({pending.length})
          </p>
          {pending.map(w => <WinnerCard key={w.id} winner={w} />)}
        </div>
      )}

      {/* Verified */}
      {verified.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-green-400/60 font-semibold flex items-center gap-2">
            <CheckCircle2 size={12} /> Verified ({verified.length})
          </p>
          {verified.map(w => <WinnerCard key={w.id} winner={w} />)}
        </div>
      )}

      {winners.length === 0 && (
        <div className="glass-card p-16 text-center">
          <Trophy size={36} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30">No winners yet. Run a draw first.</p>
        </div>
      )}
    </div>
  )
}
