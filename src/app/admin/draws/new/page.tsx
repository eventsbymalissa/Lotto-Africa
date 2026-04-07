'use client'
// src/app/admin/draws/new/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { PlayCircle, Loader2, ArrowLeft } from 'lucide-react'

export default function NewDrawPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    drawDate: '',
    drawTime: '21:00',
    jackpotAmount: '',
    ticketPrice: '2',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const drawDate = new Date(`${form.drawDate}T${form.drawTime}:00`)
      const jackpotCents = Math.round(parseFloat(form.jackpotAmount) * 100)

      const res = await fetch('/api/admin/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          drawDate: drawDate.toISOString(),
          jackpotAmount: jackpotCents,
          ticketPrice: parseInt(form.ticketPrice),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create draw'); return }
      router.push(`/admin/draws/${data.data.id}`)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          <div className="mb-8">
            <Link href="/admin/draws" className="flex items-center gap-2 text-white/30 hover:text-white/60 text-sm mb-4 transition-colors">
              <ArrowLeft size={14} /> Back to draws
            </Link>
            <h1 className="font-display text-2xl font-bold">Create New Draw</h1>
          </div>

          <div className="glass-card p-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Draw name</label>
                <input type="text" required value={form.name}
                       onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                       className="lottery-input" placeholder="e.g. MegaWin Jackpot #12" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Draw date</label>
                  <input type="date" required value={form.drawDate}
                         onChange={e => setForm(f => ({ ...f, drawDate: e.target.value }))}
                         className="lottery-input" min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Draw time</label>
                  <input type="time" required value={form.drawTime}
                         onChange={e => setForm(f => ({ ...f, drawTime: e.target.value }))}
                         className="lottery-input" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Jackpot amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">$</span>
                  <input type="number" required value={form.jackpotAmount} min="1000" step="1000"
                         onChange={e => setForm(f => ({ ...f, jackpotAmount: e.target.value }))}
                         className="lottery-input pl-8" placeholder="5000000" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Ticket price (tokens)</label>
                <select value={form.ticketPrice}
                        onChange={e => setForm(f => ({ ...f, ticketPrice: e.target.value }))}
                        className="lottery-input">
                  {[1, 2, 3, 5, 10].map(n => (
                    <option key={n} value={n}>{n} token{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading}
                        className="btn-gold w-full py-4 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</>
                           : <><PlayCircle size={18} /> Create Draw</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
