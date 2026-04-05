// src/app/player/tokens/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import TokenShopClient from '@/components/player/TokenShopClient'
import { formatCurrency } from '@/lib/utils'
import { Coins, TrendingUp, History } from 'lucide-react'
import { serializeBigInt } from '@/lib/utils'

export default async function TokensPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [user, packages, transactions] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { tokenBalance: true, verificationStatus: true } }),
    prisma.tokenPackage.findMany({ where: { isActive: true }, orderBy: { tokens: 'asc' } }),
    prisma.transaction.findMany({
      where: { userId: session.userId, type: 'TOKEN_PURCHASE' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  if (!user) redirect('/login')

  const serializedTransactions = serializeBigInt(transactions)

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar session={session} tokenBalance={user.tokenBalance} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Token Shop</h1>
            <p className="text-white/40">Purchase tokens to play in any draw</p>
          </div>

          {/* Balance card */}
          <div className="glass-card p-6 mb-8 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, rgba(240,192,64,0.2), rgba(240,192,64,0.05))', border: '1px solid rgba(240,192,64,0.3)' }}>
              <Coins size={24} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-white/40 text-sm">Your token balance</p>
              <p className="font-mono text-4xl font-bold text-yellow-400">{user.tokenBalance}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-white/30 text-xs">Each ticket costs</p>
              <p className="text-white font-semibold">2 tokens</p>
            </div>
          </div>

          {/* Unverified warning */}
          {user.verificationStatus !== 'VERIFIED' && (
            <div className="mb-8 p-5 rounded-2xl bg-yellow-500/8 border border-yellow-500/20 flex items-start gap-3">
              <TrendingUp size={18} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium text-sm">Verification required to play</p>
                <p className="text-white/40 text-sm mt-1">You can purchase tokens now, but you'll need to complete ID verification before buying tickets.</p>
              </div>
            </div>
          )}

          {/* Token packages */}
          <h2 className="font-semibold text-white/70 text-sm uppercase tracking-wider mb-4">Choose a package</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {packages.map((pkg, i) => (
              <TokenShopClient key={pkg.id} package={pkg} isPopular={i === 2} />
            ))}
          </div>

          {/* Transaction history */}
          {serializedTransactions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <History size={16} className="text-white/40" />
                <h2 className="font-semibold text-white/70 text-sm uppercase tracking-wider">Purchase History</h2>
              </div>
              <div className="glass-card overflow-hidden">
                <table className="lottery-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Package</th>
                      <th>Tokens</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serializedTransactions.map((tx: any) => (
                      <tr key={tx.id}>
                        <td className="text-white/40 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td>{tx.description}</td>
                        <td className="font-mono text-yellow-400">+{tx.tokenAmount}</td>
                        <td>{formatCurrency(BigInt(tx.amount))}</td>
                        <td><span className={`badge badge-${tx.status.toLowerCase()}`}>{tx.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
