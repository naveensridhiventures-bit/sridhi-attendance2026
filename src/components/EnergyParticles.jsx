import React from 'react'

const PARTICLES = Array.from({ length: 14 }).map((_, i) => ({
  id: i,
  left: 4 + ((i * 137) % 92),
  size: 2 + (i % 3) * 1.5,
  duration: 6 + (i % 5) * 1.6,
  delay: (i % 7) * 0.9
}))

// Slow-rising glowing particles for ambient atmosphere behind hero content.
// Distinct from the dragon's spark trail — these drift continuously across the whole hero.
export default function EnergyParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none motion-reduce:hidden" aria-hidden="true">
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-0 rounded-full bg-gold-200 animate-particleRise"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
    </div>
  )
}
