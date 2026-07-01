import React from 'react'

// A literal battery silhouette that "charges" to the day's attendance percentage —
// a brand-true centerpiece visual instead of a generic chart.
export default function EnergyGauge({ percent = 0, label = "Today's Attendance" }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const fillColor = clamped >= 70 ? '#00C853' : clamped >= 40 ? '#F2B544' : '#FF5252'

  return (
    <div className="relative bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/15 overflow-hidden">
      <div className="flex items-center gap-4">
        {/* Battery body */}
        <div className="relative w-16 h-9 shrink-0">
          <div className="absolute inset-0 rounded-[6px] border-2 border-white/70" />
          <div className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-[4px] h-3 bg-white/70 rounded-r-sm" />
          <div className="absolute inset-[3px] rounded-[3px] bg-black/15 overflow-hidden flex items-end">
            <div
              className="w-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ height: `${clamped}%`, backgroundColor: fillColor }}
            >
              <span className="absolute inset-0 animate-energyShine bg-gradient-to-t from-transparent via-white/40 to-transparent" />
            </div>
          </div>
          {clamped > 0 && (
            <svg viewBox="0 0 24 24" className="absolute -right-2 -top-2 w-4 h-4 text-gold-300 animate-pulse" fill="currentColor">
              <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
            </svg>
          )}
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
