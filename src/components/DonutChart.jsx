import React from 'react'

// Lightweight dependency-free ring chart. `segments` = [{ value, color }]
export default function DonutChart({ segments, size = 120, strokeWidth = 14, centerLabel, centerSub }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1

  let offsetAcc = 0
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EFFBF2" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const fraction = seg.value / total
          const dash = fraction * circumference
          const gap = circumference - dash
          const circle = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offsetAcc}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          )
          offsetAcc += dash
          return circle
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-ink text-lg leading-none">{centerLabel}</span>
        {centerSub && <span className="text-[9px] text-slate-400 mt-1">{centerSub}</span>}
      </div>
    </div>
  )
}
