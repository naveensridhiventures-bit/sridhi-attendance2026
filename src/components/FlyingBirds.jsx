import React from 'react'

// A small flock of minimal silhouette birds that glide across a hero section.
// Purely decorative, subtle opacity, respects prefers-reduced-motion via CSS below.
const BIRDS = [
  { top: '8%', size: 22, duration: 16, delay: 0, opacity: 0.5 },
  { top: '20%', size: 14, duration: 13, delay: 3, opacity: 0.35 },
  { top: '4%', size: 17, duration: 19, delay: 7, opacity: 0.4 },
  { top: '28%', size: 11, duration: 11, delay: 1.5, opacity: 0.3 }
]

function Bird({ size, opacity }) {
  return (
    <svg viewBox="0 0 48 24" width={size * 2} height={size} style={{ opacity }} className="block">
      <path
        d="M2 14 C 10 2, 18 2, 24 10 C 30 2, 38 2, 46 14"
        fill="none"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="animate-flap"
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  )
}

export default function FlyingBirds() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none motion-reduce:hidden" aria-hidden="true">
      {BIRDS.map((b, i) => (
        <div
          key={i}
          className="absolute left-0 animate-flyAcross"
          style={{ top: b.top, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s` }}
        >
          <Bird size={b.size} opacity={b.opacity} />
        </div>
      ))}
    </div>
  )
}
