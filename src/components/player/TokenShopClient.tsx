'use client'
// src/components/player/TokenShopClient.tsx
import { useState } from 'react'
import { Coins, Star, Loader2, CheckCircle2 } from 'lucide-react'

interface TokenPackage {
  id: string
  name: string
  tokens: number
  priceUsd: number
  bonusTokens: number
}

export default function TokenShopClient({ package: pkg, isPopular }: { package: TokenPackage; isPopular?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const totalTokens = pkg.tokens + pkg.bonusTokens
  const priceDisplay = `$${(pkg.priceUsd / 100).toFixed(2)}`
  const perToken = (pkg.priceUsd / pkg.tokens / 100).toFixed(3)

  const handlePurchase = async () => {
    setLoading(true)
    setError('')
    try {
      // In production, redirect to Stripe checkout
      // For now, simulate a successful purchase
      const res = await fetch('/api/tokens/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Purchase failed'); return }
      setSuccess(true)
      setTimeout(() => { window.location.reload() }, 1500)
    } catch {
      setError('Purchase failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`glass-card p-6 relative flex flex-col transition-all hover:border-white/15 ${
      isPopular ? 'border-yellow-500/30 glow-gold' : ''
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-amber-900"
             style={{ background: 'linear-gradient(135deg, #f59e0b, #fcd34d)' }}>
          <Star size={10} fill="currentColor" /> Most Popular
        </div>
      )}

      <div className="text-center mb-4">
        <p className="font-display text-lg font-bold text-white mb-1">{pkg.name}</p>
        <div className="flex items-center justify-center gap-1 mb-1">
          <Coins size={18} className="text-yellow-400" />
          <span className="font-mono text-3xl font-bold text-yellow-400">{totalTokens}</span>
        </div>
        {pkg.bonusTokens > 0 && (
          <p className="text-green-400 text-xs font-medium">+{pkg.bonusTokens} bonus tokens!</p>
        )}
      </div>

      <div className="flex-1" />

      <div className="text-center mb-4">
        <p className="font-display text-2xl font-bold text-white">{priceDisplay}</p>
        <p className="text-white/30 text-xs">${perToken} per token</p>
      </div>

      {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}

      {success ? (
        <div className="flex items-center justify-center gap-2 py-3 text-green-400 font-medium text-sm">
          <CheckCircle2 size={16} /> Tokens added!
        </div>
      ) : (
        <button onClick={handlePurchase} disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  isPopular
                    ? 'btn-gold'
                    : 'border border-white/10 bg-white/5 hover:bg-white/10 text-white'
                }`}>
          {loading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : `Buy for ${priceDisplay}`}
        </button>
      )}
    </div>
  )
}
