'use client'
// src/app/verify-id/page.tsx
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Upload, CheckCircle2, Clock, XCircle, AlertTriangle, FileImage, Loader2 } from 'lucide-react'
import Navbar from '@/components/ui/Navbar'

type Status = 'unverified' | 'uploading' | 'submitted' | 'pending' | 'verified' | 'rejected'

export default function VerifyIdPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [docType, setDocType] = useState('passport')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('unverified')
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setError('Please upload an image (JPG, PNG) or PDF')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB')
      return
    }
    setError('')
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) return
    setStatus('uploading')
    setError('')
    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('docType', docType)

      const res = await fetch('/api/verify/submit', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
        setStatus('unverified')
        return
      }
      setStatus('submitted')
    } catch {
      setError('Upload failed. Please try again.')
      setStatus('unverified')
    }
  }

  const docTypes = [
    { value: 'passport',        label: 'Passport' },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'national_id',     label: 'National ID Card' },
    { value: 'residence_permit', label: 'Residence Permit' },
  ]

  if (status === 'submitted') {
    return (
      <div className="min-h-screen relative">
        <div className="starfield" />
        <Navbar />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="glass-card p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
              <Clock size={32} className="text-yellow-400" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3">Under Review</h2>
            <p className="text-white/50 mb-6 leading-relaxed">
              Your ID document has been submitted and is being reviewed by our team. This typically takes 1-2 business days.
            </p>
            <div className="p-4 rounded-xl bg-white/3 border border-white/5 text-left space-y-2 mb-8">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">What happens next</p>
              {["You'll receive an email once verified", 'You can then purchase tokens', 'Start playing immediately after approval'].map(s => (
                <div key={s} className="flex items-start gap-2 text-sm text-white/60">
                  <CheckCircle2 size={14} className="text-green-400 mt-0.5 shrink-0" /> {s}
                </div>
              ))}
            </div>
            <Link href="/player" className="btn-gold w-full py-3 inline-block text-center">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="starfield" />
      <Navbar />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                 style={{ background: 'linear-gradient(135deg, rgba(67,97,238,0.2), rgba(67,97,238,0.05))', border: '1px solid rgba(67,97,238,0.3)' }}>
              <Shield size={24} className="text-blue-400" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-3">Identity Verification</h1>
            <p className="text-white/50 max-w-md mx-auto">
              To protect all players and comply with regulations, we require a one-time identity verification before you can purchase tickets.
            </p>
          </div>

          {/* Why verify */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: Shield,       label: 'Prevents Fraud',        color: '#4361ee' },
              { icon: CheckCircle2, label: 'Protects Winners',       color: '#2dc653' },
              { icon: Clock,        label: '1-2 Day Review',         color: '#fbbf24' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="glass-card p-4 text-center">
                <Icon size={20} className="mx-auto mb-2" style={{ color }} />
                <p className="text-xs text-white/50">{label}</p>
              </div>
            ))}
          </div>

          <div className="glass-card p-8 space-y-6">
            {/* Doc type */}
            <div>
              <label className="block text-sm text-white/60 mb-3">Document type</label>
              <div className="grid grid-cols-2 gap-2">
                {docTypes.map(({ value, label }) => (
                  <button key={value} type="button"
                          onClick={() => setDocType(value)}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                            docType === value
                              ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                              : 'border-white/8 bg-white/3 text-white/50 hover:border-white/15 hover:text-white/70'
                          }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload area */}
            <div>
              <label className="block text-sm text-white/60 mb-3">Upload document</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-yellow-400/60 bg-yellow-400/5'
                    : file
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/2'
                }`}>
                <input ref={fileRef} type="file" className="hidden"
                       accept="image/*,application/pdf"
                       onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

                {preview ? (
                  <div className="space-y-3">
                    <img src={preview} alt="Document preview"
                         className="max-h-40 mx-auto rounded-xl object-contain" />
                    <p className="text-green-400 text-sm font-medium">{file?.name}</p>
                    <p className="text-white/30 text-xs">Click to replace</p>
                  </div>
                ) : file ? (
                  <div className="space-y-2">
                    <FileImage size={32} className="text-green-400 mx-auto" />
                    <p className="text-green-400 text-sm font-medium">{file.name}</p>
                    <p className="text-white/30 text-xs">Click to replace</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload size={32} className="text-white/20 mx-auto" />
                    <div>
                      <p className="text-white/60 font-medium">Drop your document here</p>
                      <p className="text-white/30 text-sm mt-1">or click to browse</p>
                    </div>
                    <p className="text-white/20 text-xs">JPG, PNG or PDF · Max 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Privacy note */}
            <div className="flex gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
              <AlertTriangle size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-white/40 text-xs leading-relaxed">
                Your document is encrypted and stored securely. It is only accessible to authorized verification staff and is never shared with third parties.
              </p>
            </div>

            {error && (
              <div className="flex gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <XCircle size={16} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={!file || status === 'uploading'}
                    className="btn-gold w-full py-4 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
              {status === 'uploading'
                ? <><Loader2 size={18} className="animate-spin" /> Uploading...</>
                : <><Shield size={18} /> Submit for Verification</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
