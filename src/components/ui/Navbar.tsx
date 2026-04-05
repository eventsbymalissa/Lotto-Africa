'use client'
// src/components/ui/Navbar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Ticket, Trophy, BarChart2, User, LogOut, Settings, Menu, X, Coins } from 'lucide-react'

interface NavbarProps {
  session?: {
    userId: string
    email: string
    role: string
    verificationStatus: string
  } | null
  tokenBalance?: number
}

export default function Navbar({ session, tokenBalance = 0 }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/',            label: 'Home',    icon: null },
    { href: '/buy-tickets', label: 'Play',    icon: Ticket },
    { href: '/results',     label: 'Results', icon: Trophy },
    { href: '/draw',        label: 'Live Draw', icon: BarChart2 },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
         style={{ background: 'rgba(6,6,16,0.9)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg glow-gold flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #f59e0b, #fcd34d)' }}>
              <Trophy size={16} className="text-amber-900" />
            </div>
            <span className="font-display text-xl font-bold text-gold-shimmer">MegaWin</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      pathname === href
                        ? 'bg-white/8 text-gold-400 text-[#fbbf24]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}>
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                {/* Token balance */}
                <Link href="/player/tokens" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 transition-all">
                  <Coins size={14} className="text-yellow-400" />
                  <span className="text-yellow-400 font-mono text-sm font-semibold">{tokenBalance}</span>
                </Link>

                {/* Dashboard link */}
                {session.role === 'ADMIN' ? (
                  <Link href="/admin" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-all">
                    <Settings size={14} />
                    Admin
                  </Link>
                ) : (
                  <Link href="/player" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-all">
                    <User size={14} />
                    Dashboard
                  </Link>
                )}

                {/* Logout */}
                <button onClick={handleLogout}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/50 hover:text-red-400 text-sm transition-all">
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login" className="btn-ghost !py-2 !px-4 !text-xs">Sign In</Link>
                <Link href="/register" className="btn-gold !py-2 !px-4 !text-xs">Join Now</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-lg text-white/60 hover:text-white"
                    onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 px-4 py-4 space-y-1"
             style={{ background: 'rgba(6,6,16,0.98)' }}>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all">
              {Icon && <Icon size={16} />}
              {label}
            </Link>
          ))}
          {session ? (
            <>
              <div className="flex items-center gap-2 px-4 py-3">
                <Coins size={16} className="text-yellow-400" />
                <span className="text-yellow-400 font-mono font-semibold">{tokenBalance} tokens</span>
              </div>
              <Link href={session.role === 'ADMIN' ? '/admin' : '/player'} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5">
                {session.role === 'ADMIN' ? <Settings size={16} /> : <User size={16} />}
                {session.role === 'ADMIN' ? 'Admin Dashboard' : 'My Dashboard'}
              </Link>
              <button onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:text-red-400 w-full">
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <div className="flex gap-2 px-4 pt-2">
              <Link href="/login" className="btn-ghost !py-2 flex-1 text-center">Sign In</Link>
              <Link href="/register" className="btn-gold !py-2 flex-1 text-center">Join</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
