import React from 'react'

// Clean circular progress ring showing today's live attendance % —
// replaces the old battery-gauge visual with a neutral, professional indicator.
export default function AttendanceRing({ percent = 0, label = "Today's Attendance" }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const ringColor = clamped >= 70 ? '#00C853' : clamped >= 40 ? '#F2B544' : '#FF5252'
  const r = 26
  const circumference = 2 * Math.PI * r
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/15 overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6" />
            <circle
              cx="32" cy="32" r={r} fill="none"
              stroke={ringColor} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">{clamped}%</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-display font-bold text-white text-2xl leading-none">
            {clamped}
            <span className="text-sm align-top">%</span>
          </p>
          <p className="text-brand-100 text-[11px] mt-1">{label}</p>
        </div>
      </div>
    </div>
  )
}
