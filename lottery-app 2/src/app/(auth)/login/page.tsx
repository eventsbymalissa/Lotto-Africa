'use client'
// src/app/(auth)/login/page.tsx
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Trophy, Eye, EyeOff, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/player'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Login failed'); return }
      router.push(data.data.role === 'ADMIN' ? '/admin' : redirect)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-8">
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-white/60 mb-2">Email address</label>
          <input
            type="email" required value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="lottery-input" placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} required value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="lottery-input pr-12" placeholder="••••••••"
            />
            <button
              type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="btn-gold w-full py-3.5 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/5 text-center">
        <p className="text-white/40 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-yellow-400 hover:text-yellow-300 font-medium">
            Create one free
          </Link>
        </p>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-white/3 border border-white/5 text-xs text-white/30 space-y-1">
        <p className="font-semibold text-white/40">Demo credentials:</p>
        <p>Player: player@lottery.com / Player@123456</p>
        <p>Admin: admin@lottery.com / Admin@123456</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="starfield" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #fcd34d)' }}
            >
              <Trophy size={20} className="text-amber-900" />
            </div>
            <span className="font-display text-2xl font-bold text-gold-shimmer">MegaWin</span>
          </Link>
          <h1 className="font-display text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-white/40">Sign in to your account</p>
        </div>

        <Suspense fallback={
          <div className="glass-card p-8 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-white/30" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
