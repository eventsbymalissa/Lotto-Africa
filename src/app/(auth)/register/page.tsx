'use client'
// src/app/(auth)/register/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trophy, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordStrength = () => {
    const p = form.password
    if (!p) return 0
    let score = 0
    if (p.length >= 8)  score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }

  const strength = passwordStrength()
  const strengthColors = ['', '#ef4444', '#f97316', '#fbbf24', '#22c55e']
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Registration failed'); return }
      router.push('/verify-id')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const perks = ['Cryptographically verified draws', 'Instant winner notifications', 'Secure token system']

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <div className="starfield" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
             style={{ background: 'radial-gradient(circle, #4361ee, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #f59e0b, #fcd34d)' }}>
              <Trophy size={20} className="text-amber-900" />
            </div>
            <span className="font-display text-2xl font-bold text-gold-shimmer">MegaWin</span>
          </Link>
          <h1 className="font-display text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-white/40">Join and start playing today</p>
        </div>

        {/* Perks */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {perks.map(p => (
            <span key={p} className="flex items-center gap-1.5 text-xs text-white/40">
              <CheckCircle2 size={12} className="text-green-400" /> {p}
            </span>
          ))}
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">First name</label>
                <input type="text" required value={form.firstName}
                       onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                       className="lottery-input" placeholder="Jane" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Last name</label>
                <input type="text" required value={form.lastName}
                       onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                       className="lottery-input" placeholder="Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5">Email address</label>
              <input type="email" required value={form.email}
                     onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                     className="lottery-input" placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5">Phone number <span className="text-white/25">(optional)</span></label>
              <input type="tel" value={form.phone}
                     onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                     className="lottery-input" placeholder="+1 (555) 000-0000" />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password}
                       onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                       className="lottery-input pr-12" placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300"
                         style={{ width: `${(strength / 4) * 100}%`, background: strengthColors[strength] }} />
                  </div>
                  <span className="text-xs" style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5">Confirm password</label>
              <input type="password" required value={form.confirmPassword}
                     onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                     className={`lottery-input ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500/50' : ''}`}
                     placeholder="Repeat your password" />
            </div>

            <p className="text-white/25 text-xs leading-relaxed">
              By creating an account, you agree to our Terms of Service and Privacy Policy. You must be 18+ to play.
            </p>

            <button type="submit" disabled={loading} className="btn-gold w-full py-3.5 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-white/40 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-yellow-400 hover:text-yellow-300 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
