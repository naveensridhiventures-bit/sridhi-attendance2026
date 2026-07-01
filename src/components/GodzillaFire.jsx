import React from 'react'

const EMBERS = Array.from({ length: 9 }).map((_, i) => ({
  delay: i * 0.16,
  size: 3 + (i % 3) * 2,
  spread: 10 + i * 9,
  riseY: -30 - (i % 4) * 14
}))

// A huge kaiju silhouette looming in the corner of the Attendance hero,
// idly swaying and breathing an animated, flickering fire burst.
// Distinct from DragonFly (used on Home/elsewhere) — bigger, stationary, more dramatic.
export default function GodzillaFire({ size = 360, side = 'right' }) {
  const isRight = side === 'right'
  return (
    <div
      className={`absolute -bottom-6 ${isRight ? '-right-10' : '-left-10'} pointer-events-none motion-reduce:hidden origin-bottom animate-idleSway`}
      style={{ width: size, transform: isRight ? undefined : 'scaleX(-1)' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 300 320" width={size} height={size * 1.07} fill="none" style={{ filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.45))' }}>
        <defs>
          <linearGradient id="kaijuBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2B3A33" />
            <stop offset="55%" stopColor="#16211C" />
            <stop offset="100%" stopColor="#0A120E" />
          </linearGradient>
          <radialGradient id="fireCore" cx="0%" cy="50%" r="80%">
            <stop offset="0%" stopColor="#FFF3C4" />
            <stop offset="35%" stopColor="#F2B544" />
            <stop offset="70%" stopColor="#E8601A" />
            <stop offset="100%" stopColor="#C7341A" stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* Tail */}
        <path d="M210 270 C 260 280, 295 260, 296 230 C 280 248, 250 252, 222 244 Z" fill="url(#kaijuBody)" />

        {/* Legs */}
        <path d="M150 250 C 145 275, 140 295, 130 312 L 158 312 C 162 292, 165 270, 168 250 Z" fill="url(#kaijuBody)" />
        <path d="M195 246 C 192 272, 190 294, 184 312 L 212 312 C 214 292, 216 270, 218 246 Z" fill="url(#kaijuBody)" />

        {/* Body */}
        <path
          d="M120 150 C 115 195, 130 235, 165 252 C 200 264, 230 250, 240 215 C 248 185, 238 150, 210 130 C 185 113, 145 115, 120 150 Z"
          fill="url(#kaijuBody)"
        />

        {/* Arms */}
        <path d="M125 175 C 105 182, 90 195, 84 212 C 96 206, 110 200, 122 196 Z" fill="url(#kaijuBody)" />
        <path d="M232 165 C 252 168, 268 178, 276 194 C 264 190, 250 188, 238 188 Z" fill="url(#kaijuBody)" />

        {/* Spine plates */}
        <path d="M140 122 L 150 95 L 160 124 Z" fill="#E8A317" />
        <path d="M165 112 L 176 80 L 186 116 Z" fill="#E8A317" />
        <path d="M192 110 L 203 78 L 213 114 Z" fill="#E8A317" />
        <path d="M216 118 L 226 90 L 235 122 Z" fill="#E8A317" />

        {/* Neck + head */}
        <path
          d="M95 140 C 80 130, 65 122, 48 122 C 58 132, 64 144, 64 156 C 80 152, 96 148, 112 152 C 108 146, 102 142, 95 140 Z"
          fill="url(#kaijuBody)"
        />
        {/* Eye */}
        <circle cx="62" cy="134" r="3.4" fill="#F2D98A" />

        {/* FIRE BREATH */}
        <g style={{ transformBox: 'fill-box', transformOrigin: '100% 50%' }} className="animate-fireFlicker">
          <path
            d="M48 122 C 10 110, -30 116, -55 132 C -25 130, 5 134, 30 142 C 0 144, -28 152, -48 166 C -16 158, 16 156, 42 158 C 18 164, -6 174, -20 188 C 10 178, 36 170, 56 158 Z"
            fill="url(#fireCore)"
            opacity="0.92"
          />
        </g>

        {/* Embers */}
        {EMBERS.map((e, i) => (
          <circle
            key={i}
            cx={50 - e.spread}
            cy={128 + (i % 3) * 12}
            r={e.size / 3}
            fill="#FFD27A"
            className="animate-emberRise"
            style={{ animationDelay: `${e.delay}s`, '--riseY': `${e.riseY}px` }}
          />
        ))}
      </svg>
    </div>
  )
}
