import React from 'react'

export const SPEED_MUL = { slow: 1.7, normal: 1, fast: 0.55 }

// Same numbers every render (no Math.random), so the effect doesn't jump around on re-render
const rnd = (i, salt = 1) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

const CONFETTI_COLORS = ['#F2B544', '#45BE63', '#F472B6', '#60A5FA', '#FFFFFF', '#FB7185']
const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  top: `${6 + rnd(i, 1) * 84}%`, left: `${3 + rnd(i, 2) * 92}%`, size: 8 + Math.round(rnd(i, 3) * 12),
  d: 2.4 + rnd(i, 4) * 2.6, delay: -rnd(i, 5) * 5
}))
const ORBS = Array.from({ length: 9 }, (_, i) => ({
  left: `${rnd(i, 6) * 95}%`, size: 14 + Math.round(rnd(i, 7) * 34), d: 7 + rnd(i, 8) * 6, delay: -rnd(i, 9) * 10, bx: Math.round((rnd(i, 10) - 0.5) * 70)
}))
const PIECES = Array.from({ length: 26 }, (_, i) => ({
  left: `${rnd(i, 11) * 100}%`, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], d: 4.5 + rnd(i, 12) * 3.5,
  delay: -rnd(i, 13) * 8, cx: Math.round((rnd(i, 14) - 0.5) * 90), cr: Math.round(360 + rnd(i, 15) * 720)
}))

// Decorative layer over the hero. Admin picks any combination: sparkles, light sweep, glow orbs, confetti.
export default function HeroEffects({ effects = [], speed = 'normal' }) {
  if (!effects || !effects.length) return null
  const spd = SPEED_MUL[speed] ?? 1
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none" style={{ '--spd': spd }}>
      {effects.includes('bokeh') &&
        ORBS.map((o, i) => (
          <span key={`o${i}`} className="fx-bokeh" style={{ left: o.left, width: o.size, height: o.size, '--d': `${o.d}s`, '--delay': `${o.delay}s`, '--bx': `${o.bx}px` }} />
        ))}
      {effects.includes('sweep') && <span className="fx-sweep" />}
      {effects.includes('sparkles') &&
        SPARKS.map((s, i) => (
          <svg key={`s${i}`} viewBox="0 0 24 24" width={s.size} height={s.size} fill="#FFE9A8" className="fx-spark"
            style={{ top: s.top, left: s.left, '--d': `${s.d}s`, '--delay': `${s.delay}s`, filter: 'drop-shadow(0 0 4px rgba(255,230,150,0.9))' }}>
            <path d="M12 1l2.2 7.8L22 12l-7.8 2.2L12 23l-2.2-8.8L2 12l7.8-3.2z" />
          </svg>
        ))}
      {effects.includes('confetti') &&
        PIECES.map((p, i) => (
          <span key={`c${i}`} className="fx-confetti" style={{ left: p.left, background: p.color, '--d': `${p.d}s`, '--delay': `${p.delay}s`, '--cx': `${p.cx}px`, '--cr': `${p.cr}deg` }} />
        ))}
    </div>
  )
}
