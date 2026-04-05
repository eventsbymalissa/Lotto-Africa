// src/app/admin/players/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import AdminPlayersClient from '@/components/admin/AdminPlayersClient'
import { serializeBigInt } from '@/lib/utils'
import { Users } from 'lucide-react'

export default async function AdminPlayersPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/')

  const players = await prisma.user.findMany({
    where: { role: 'PLAYER' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      tokenBalance: true,
      verificationStatus: true,
      createdAt: true,
      _count: { select: { tickets: true, winnings: true } },
    },
  })

  const data = serializeBigInt(players)

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-white/30 text-sm mb-1">Admin · <Link href="/admin" className="hover:text-white/60">Dashboard</Link></p>
              <h1 className="font-display text-2xl font-bold flex items-center gap-3">
                <Users size={22} className="text-white/40" /> All Players
              </h1>
            </div>
            <p className="text-white/30 text-sm">{players.length} registered</p>
          </div>

          <AdminPlayersClient players={data as any[]} />
        </div>
      </div>
    </div>
  )
}
