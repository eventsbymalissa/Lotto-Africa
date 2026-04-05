// src/app/admin/winners/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import AdminWinnersClient from '@/components/admin/AdminWinnersClient'
import { serializeBigInt } from '@/lib/utils'
import { Trophy } from 'lucide-react'

export default async function AdminWinnersPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/')

  const winners = await prisma.winner.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, verificationStatus: true } },
      draw: { select: { name: true, drawDate: true } },
      ticket: { select: { numbers: true } },
    },
  })

  const data = serializeBigInt(winners)

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-white/30 text-sm mb-1">Admin · <Link href="/admin" className="hover:text-white/60">Dashboard</Link></p>
              <h1 className="font-display text-2xl font-bold flex items-center gap-3">
                <Trophy size={22} className="text-yellow-400/60" /> Winner Verification
              </h1>
            </div>
            <div className="text-right">
              <p className="text-white/30 text-sm">{winners.length} total winners</p>
              <p className="text-yellow-400/60 text-xs">{winners.filter(w => !w.verified).length} pending verification</p>
            </div>
          </div>

          <AdminWinnersClient winners={data as any[]} adminId={session.userId} />
        </div>
      </div>
    </div>
  )
}
