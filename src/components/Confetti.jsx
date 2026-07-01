import React, { useEffect, useState } from 'react'

const COLORS = ['#1F9D4C', '#F2B544', '#E8A317', '#45BE63', '#FFFFFF']

// Imperative-ish confetti burst: render <Confetti trigger={n} /> and bump `trigger`
// (e.g. a counter state) each time you want a new burst to fire.
export default function Confetti({ trigger }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!trigger) return
    const next = Array.from({ length: 26 }).map((_, i) => ({
      id: `${trigger}-${i}`,
      left: 40 + Math.random() * 20,
      delay: Math.random() * 0.15,
      duration: 0.9 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 220,
      color: COLORS[i % COLORS.length],
      rotate: Math.random() * 360,
      size: 6 + Math.random() * 5
    }))
    setPieces(next)
    const t = setTimeout(() => setPieces([]), 1700)
    return () => clearTimeout(t)
  }, [trigger])

  if (pieces.length === 0) return null

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-1/3 rounded-sm animate-confettiFall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
            '--rot': `${p.rotate}deg`
          }}
        />
      ))}
    </div>
  )
}
