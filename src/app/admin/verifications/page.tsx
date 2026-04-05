// src/app/admin/verifications/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import VerificationReviewClient from '@/components/admin/VerificationReviewClient'
import { serializeBigInt } from '@/lib/utils'
import { ShieldCheck } from 'lucide-react'

export default async function AdminVerificationsPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/')

  const pending = await prisma.user.findMany({
    where: { verificationStatus: 'PENDING', role: 'PLAYER' },
    orderBy: { updatedAt: 'asc' },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      idDocumentUrl: true, idDocumentType: true, createdAt: true, updatedAt: true,
      verificationNotes: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { note: true, createdAt: true },
      },
    },
  })

  const data = serializeBigInt(pending)

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <ShieldCheck size={20} className="text-yellow-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">KYC Verifications</h1>
              <p className="text-white/40 text-sm">{pending.length} pending review{pending.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {pending.length === 0 ? (
            <div className="glass-card p-16 text-center">
              <ShieldCheck size={40} className="text-green-400 mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold text-green-400 mb-2">All caught up!</h2>
              <p className="text-white/40">No pending verifications at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(data as any[]).map((user: any) => (
                <VerificationReviewClient key={user.id} user={user} adminId={session.userId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
