// src/app/admin/players/[id]/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { formatCurrency, formatDate, serializeBigInt } from '@/lib/utils'
import { ArrowLeft, Shield, Coins, Ticket, Trophy, FileText } from 'lucide-react'

export default async function AdminPlayerDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/')

  const player = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      tickets: {
        include: { draw: { select: { name: true, status: true, drawDate: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      winnings: {
        include: { draw: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      verificationNotes: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!player) notFound()

  const data = serializeBigInt(player)
  const p = data as any

  const verBadge: Record<string, string> = {
    VERIFIED: 'badge-verified', PENDING: 'badge-pending',
    UNVERIFIED: 'badge-unverified', REJECTED: 'badge-rejected',
  }

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin/players" className="flex items-center gap-2 text-white/30 hover:text-white/60 text-sm mb-4 transition-colors">
              <ArrowLeft size={14} /> Back to players
            </Link>
            <div className="flex flex-wrap items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold text-white/60">
                {player.firstName[0]}{player.lastName[0]}
              </div>
              <div className="flex-1">
                <h1 className="font-display text-2xl font-bold">{player.firstName} {player.lastName}</h1>
                <p className="text-white/40">{player.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`badge ${verBadge[player.verificationStatus] ?? ''}`}>{player.verificationStatus}</span>
                  {player.idDocumentType && (
                    <span className="badge badge-unverified text-xs">{player.idDocumentType.replace('_', ' ')}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                {player.verificationStatus === 'PENDING' && (
                  <Link href="/admin/verifications" className="px-4 py-2 rounded-xl text-sm bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/15 transition-all">
                    Review KYC
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Token Balance', value: player.tokenBalance, icon: Coins, color: '#f59e0b' },
              { label: 'Tickets',       value: player.tickets.length, icon: Ticket, color: '#4361ee' },
              { label: 'Wins',          value: player.winnings.length, icon: Trophy, color: '#2dc653' },
              { label: 'Transactions',  value: player.transactions.length, icon: FileText, color: '#7c3aed' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass-card p-4">
                <Icon size={15} style={{ color }} className="mb-2" />
                <p className="font-mono text-2xl font-bold text-white">{value}</p>
                <p className="text-white/30 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Document preview */}
          {player.idDocumentUrl && (
            <div className="glass-card p-6 mb-6">
              <p className="text-xs uppercase tracking-wider text-white/30 font-semibold mb-4 flex items-center gap-2">
                <Shield size={13} /> Identity Document
              </p>
              <div className="flex flex-wrap gap-6 items-start">
                {player.idDocumentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={player.idDocumentUrl} alt="ID Document"
                       className="max-h-48 rounded-xl border border-white/8 object-contain" />
                ) : (
                  <a href={player.idDocumentUrl} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-blue-400 hover:underline text-sm">
                    <FileText size={14} /> View Document PDF
                  </a>
                )}
                <div className="text-sm space-y-1">
                  <p className="text-white/30">Type: <span className="text-white/60">{player.idDocumentType?.replace('_', ' ')}</span></p>
                  <p className="text-white/30">Status: <span className={`${
                    player.verificationStatus === 'VERIFIED' ? 'text-green-400'
                    : player.verificationStatus === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'
                  }`}>{player.verificationStatus}</span></p>
                </div>
              </div>

              {/* Verification notes */}
              {p.verificationNotes?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-white/25 uppercase tracking-wider">Admin notes</p>
                  {p.verificationNotes.map((note: any) => (
                    <div key={note.id} className="p-3 rounded-lg bg-white/3 text-sm text-white/50">
                      {note.note}
                      <span className="text-white/20 text-xs ml-2">{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Transactions */}
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h2 className="font-semibold text-sm">All Transactions</h2>
              </div>
              <div className="divide-y divide-white/4 max-h-80 overflow-y-auto">
                {p.transactions.length === 0 ? (
                  <div className="p-6 text-center text-white/25 text-sm">No transactions</div>
                ) : (
                  p.transactions.map((tx: any) => (
                    <div key={tx.id} className="p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/70 truncate">{tx.description}</p>
                        <p className="text-white/25 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {tx.tokenAmount != null && (
                          <p className={`font-mono text-sm font-semibold ${tx.tokenAmount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.tokenAmount > 0 ? '+' : ''}{tx.tokenAmount}
                          </p>
                        )}
                        {BigInt(tx.amount) > 0n && (
                          <p className="text-white/30 text-xs">{formatCurrency(BigInt(tx.amount))}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Wins */}
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h2 className="font-semibold text-sm">Winnings</h2>
              </div>
              <div className="divide-y divide-white/4 max-h-80 overflow-y-auto">
                {p.winnings.length === 0 ? (
                  <div className="p-6 text-center text-white/25 text-sm">No winnings</div>
                ) : (
                  p.winnings.map((w: any) => (
                    <div key={w.id} className="p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-yellow-400 font-medium text-sm">{w.prizeTier}</p>
                        <p className="text-white/30 text-xs truncate">{w.draw?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-yellow-400 font-bold text-sm">{formatCurrency(BigInt(w.prizeAmount))}</p>
                        <p className={`text-xs mt-0.5 ${w.verified ? 'text-green-400' : 'text-yellow-400/50'}`}>
                          {w.verified ? '✓ Verified' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
