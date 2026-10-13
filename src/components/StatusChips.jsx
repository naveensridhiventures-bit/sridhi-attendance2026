import React, { useState } from 'react'
import { STATUS_OPTIONS } from '../utils/attendanceStatus.js'

// The six marks the whole app runs on, in the exact colours used in the Google Sheet.
// They pop in one after another when the card opens, and each one bounces when touched.
const COLORS = {
  present: ['#22C55E', '#fff'],
  half: ['#F97316', '#fff'],
  absent: ['#EF4444', '#fff'],
  weekoff: ['#FACC15', '#3B2F00'],
  wop: ['#9333EA', '#fff'],
  na: ['#3B6FE0', '#fff']
}

export default function StatusChips() {
  const [bounce, setBounce] = useState(null)
  return (
    <div className="flex items-center gap-1.5" aria-label="Attendance marks: P, H, A, WO, WOP, NA">
      {STATUS_OPTIONS.map((s, i) => {
        const [bg, fg] = COLORS[s.key] || ['#94A3B8', '#fff']
        return (
          <span
            key={s.key}
            title={s.full}
            style={{ '--i': i, background: bg, color: fg }}
            onPointerDown={() => setBounce(s.key)}
            onAnimationEnd={(e) => { if (e.animationName === 'chipBounce') setBounce(null) }}
            className={`chip-pop inline-flex items-center justify-center rounded-full font-display font-bold text-[10px] h-7 min-w-[1.75rem] px-2 shadow-[0_3px_10px_-2px_rgba(0,0,0,0.35)] ring-1 ring-white/30 select-none ${bounce === s.key ? 'chip-bounce' : ''}`}
          >
            {s.label}
          </span>
        )
      })}
    </div>
  )
}
