'use client'
// src/components/lottery/HomeClient.tsx
import { useState, useEffect } from 'react'
import { getCountdown } from '@/lib/utils'

export default function HomeClient({ drawDate }: { drawDate: string }) {
  const [countdown, setCountdown] = useState(getCountdown(drawDate))

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(drawDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [drawDate])

  if (countdown.isExpired) {
    return <p className="text-white/50 text-sm">Draw in progress...</p>
  }

  const units = [
    { label: 'Days',    value: countdown.days },
    { label: 'Hours',   value: countdown.hours },
    { label: 'Minutes', value: countdown.minutes },
    { label: 'Seconds', value: countdown.seconds },
  ]

  return (
    <div>
      <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Draw closes in</p>
      <div className="flex justify-center gap-3 sm:gap-6">
        {units.map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="font-mono text-3xl sm:text-4xl font-bold text-white tabular-nums">
              {String(value).padStart(2, '0')}
            </div>
            <div className="text-white/30 text-xs uppercase tracking-wider mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
