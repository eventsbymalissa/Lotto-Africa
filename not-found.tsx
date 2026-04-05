// src/app/not-found.tsx
import Link from 'next/link'
import { Trophy } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="starfield" />
      <div className="relative z-10 text-center">
        <div className="font-display text-8xl font-bold text-gold-shimmer mb-4">404</div>
        <h1 className="font-display text-2xl font-bold mb-3">Page Not Found</h1>
        <p className="text-white/40 mb-8">This page doesn't exist or has been moved.</p>
        <Link href="/" className="btn-gold px-8 py-3 inline-flex items-center gap-2">
          <Trophy size={16} /> Back to Home
        </Link>
      </div>
    </div>
  )
}
