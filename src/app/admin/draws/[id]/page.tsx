// src/app/admin/draws/[id]/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import DrawManagerClient from '@/components/admin/DrawManagerClient'
import { formatDate, serializeBigInt, safeCurrency } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export default async function AdminDrawDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/')

  const draw = await prisma.draw.findUnique({
    where: { id: params.id },
    include: {
      tickets: {
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      },
      winners: {
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
      _count: { select: { tickets: true, winners: true } },
    },
  })

  if (!draw) notFound()

  const data = serializeBigInt(draw)

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <Link href="/admin/draws" className="flex items-center gap-2 text-white/30 hover:text-white/60 text-sm mb-4 transition-colors">
              <ArrowLeft size={14} /> Back to draws
            </Link>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold">{draw.name}</h1>
                <p className="text-white/40 text-sm mt-1">{formatDate(draw.drawDate)}</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-mono text-2xl font-bold">{safeCurrency(draw.jackpotAmount)}</p>
                <p className="text-white/30 text-sm">{draw._count.tickets} tickets · {draw._count.winners} winners</p>
              </div>
            </div>
          </div>

          <DrawManagerClient draw={data as any} />
        </div>
      </div>
    </div>
  )
}
