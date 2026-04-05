'use client'
// src/components/admin/VerificationReviewClient.tsx
import { useState } from 'react'
import { CheckCircle2, XCircle, FileImage, Clock, User, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface VerificationUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  idDocumentUrl?: string
  idDocumentType?: string
  createdAt: string
  updatedAt: string
  verificationNotes: { note: string; createdAt: string }[]
}

export default function VerificationReviewClient({ user, adminId }: { user: VerificationUser; adminId: string }) {
  const [expanded, setExpanded] = useState(true)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)
  const [error, setError] = useState('')

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(action)
    setError('')
    try {
      const res = await fetch('/api/admin/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action, note }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Action failed'); return }
      setDone(action)
    } catch {
      setError('Request failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  if (done) {
    return (
      <div className={`glass-card p-5 flex items-center gap-4 border ${
        done === 'approved' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
      }`}>
        {done === 'approved'
          ? <CheckCircle2 size={20} className="text-green-400" />
          : <XCircle size={20} className="text-red-400" />}
        <div>
          <p className={`font-semibold text-sm ${done === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
            {user.firstName} {user.lastName} &mdash; {done === 'approved' ? 'Verification Approved' : 'Verification Rejected'}
          </p>
          <p className="text-white/30 text-xs mt-0.5">{user.email}</p>
        </div>
      </div>
    )
  }

  const docTypeLabels: Record<string, string> = {
    passport: 'Passport', drivers_license: "Driver's License",
    national_id: 'National ID', residence_permit: 'Residence Permit',
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-white/60">
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white">{user.firstName} {user.lastName}</p>
          <p className="text-white/40 text-sm">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-yellow-400 text-xs">
            <Clock size={12} /> Pending
          </div>
          <p className="text-white/25 text-xs">{new Date(user.updatedAt).toLocaleDateString()}</p>
          {expanded ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 p-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            {/* User info */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-white/30 font-semibold">Player Information</p>
              {[
                { label: 'Full Name', value: `${user.firstName} ${user.lastName}` },
                { label: 'Email', value: user.email },
                { label: 'Phone', value: user.phone ?? 'Not provided' },
                { label: 'Document Type', value: docTypeLabels[user.idDocumentType ?? ''] ?? user.idDocumentType ?? 'Unknown' },
                { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-white/30 text-sm shrink-0">{label}</span>
                  <span className="text-white/70 text-sm text-right">{value}</span>
                </div>
              ))}
            </div>

            {/* Document preview */}
            <div>
              <p className="text-xs uppercase tracking-wider text-white/30 font-semibold mb-3">Submitted Document</p>
              {user.idDocumentUrl ? (
                <div className="rounded-xl overflow-hidden border border-white/8 bg-white/3">
                  {user.idDocumentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={user.idDocumentUrl} alt="ID Document"
                         className="w-full object-contain max-h-48" />
                  ) : (
                    <div className="p-6 text-center">
                      <FileImage size={32} className="text-white/20 mx-auto mb-2" />
                      <p className="text-white/40 text-sm">PDF Document</p>
                      <a href={user.idDocumentUrl} target="_blank" rel="noopener noreferrer"
                         className="text-blue-400 text-sm hover:underline mt-2 inline-block">View PDF</a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-white/8 text-center">
                  <p className="text-white/30 text-sm">No document uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin note */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/30 font-semibold mb-2">
              Add note (optional)
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                      className="lottery-input resize-none text-sm"
                      placeholder="Reason for rejection, or confirmation note..." />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => handleAction('approve')} disabled={!!loading}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50">
              {loading === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Approve
            </button>
            <button onClick={() => handleAction('reject')} disabled={!!loading}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
              {loading === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
