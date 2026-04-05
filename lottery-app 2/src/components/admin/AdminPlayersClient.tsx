'use client'
// src/components/admin/AdminPlayersClient.tsx
import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, ChevronRight, Coins } from 'lucide-react'

interface Player {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  tokenBalance: number
  verificationStatus: string
  createdAt: string
  _count: { tickets: number; winnings: number }
}

const verBadge: Record<string, string> = {
  VERIFIED: 'badge-verified', PENDING: 'badge-pending',
  UNVERIFIED: 'badge-unverified', REJECTED: 'badge-rejected',
}

export default function AdminPlayersClient({ players }: { players: Player[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('ALL')

  const filtered = players.filter(p => {
    const matchSearch =
      `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || p.verificationStatus === filter
    return matchSearch && matchFilter
  })

  const filterButtons = [
    { label: 'All', value: 'ALL', count: players.length },
    { label: 'Verified', value: 'VERIFIED', count: players.filter(p => p.verificationStatus === 'VERIFIED').length },
    { label: 'Pending', value: 'PENDING', count: players.filter(p => p.verificationStatus === 'PENDING').length },
    { label: 'Unverified', value: 'UNVERIFIED', count: players.filter(p => p.verificationStatus === 'UNVERIFIED').length },
    { label: 'Rejected', value: 'REJECTED', count: players.filter(p => p.verificationStatus === 'REJECTED').length },
  ]

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search players..."
            className="lottery-input pl-10 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterButtons.map(({ label, value, count }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === value
                  ? 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400'
                  : 'bg-white/4 border border-white/8 text-white/40 hover:text-white/60'
              }`}
            >
              {label} <span className="ml-1 opacity-60">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="lottery-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Email</th>
              <th>Status</th>
              <th>Tokens</th>
              <th>Tickets</th>
              <th>Wins</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-white/25 py-10">No players match your search</td>
              </tr>
            ) : (
              filtered.map(player => (
                <tr key={player.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/50 shrink-0">
                        {player.firstName[0]}{player.lastName[0]}
                      </div>
                      <span className="font-medium text-white/80">{player.firstName} {player.lastName}</span>
                    </div>
                  </td>
                  <td className="text-white/40 text-xs">{player.email}</td>
                  <td>
                    <span className={`badge ${verBadge[player.verificationStatus] ?? ''} text-xs`}>
                      {player.verificationStatus}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Coins size={12} className="text-yellow-400/60" />
                      <span className="font-mono text-sm text-yellow-400/80">{player.tokenBalance}</span>
                    </div>
                  </td>
                  <td className="font-mono text-sm">{player._count.tickets}</td>
                  <td className="font-mono text-sm">{player._count.winnings}</td>
                  <td className="text-white/30 text-xs">{new Date(player.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/players/${player.id}`}
                          className="flex items-center gap-1 text-white/25 hover:text-white/60 text-xs transition-colors">
                      View <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-white/20 text-xs text-right">{filtered.length} of {players.length} players</p>
    </div>
  )
}
