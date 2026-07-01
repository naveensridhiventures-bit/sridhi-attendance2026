import React from 'react'

const CLOUDS = [
  { top: '10%', size: 90, duration: 38, delay: 0, opacity: 0.12 },
  { top: '34%', size: 60, duration: 46, delay: 6, opacity: 0.1 },
  { top: '2%', size: 70, duration: 52, delay: 14, opacity: 0.08 }
]

const SPARKS = Array.from({ length: 7 }).map((_, i) => ({
  delay: i * 0.18,
  size: 3 + (i % 3),
  drift: -10 - i * 6
}))

function Cloud({ size, opacity }) {
  return (
    <svg viewBox="0 0 100 40" width={size} height={size * 0.4} style={{ opacity }}>
      <ellipse cx="30" cy="22" rx="22" ry="12" fill="white" />
      <ellipse cx="55" cy="16" rx="18" ry="14" fill="white" />
      <ellipse cx="75" cy="24" rx="16" ry="10" fill="white" />
    </svg>
  )
}

// A large stylised dragon silhouette that glides across hero sections with
// wing-flap and tail-undulation animation, trailing soft sparks, with a
// slow parallax cloud layer behind it. Pure SVG/CSS, no images needed.
export default function DragonFly({ flip = false, size = 420, top = '-6%', duration = 22, delay = 0 }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none motion-reduce:hidden" aria-hidden="true">
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="absolute left-0 animate-flyAcross"
          style={{ top: c.top, animationDuration: `${c.duration}s`, animationDelay: `${c.delay}s` }}
        >
          <Cloud size={c.size} opacity={c.opacity} />
        </div>
      ))}

      <div
        className="absolute left-0 animate-flyAcross"
        style={{
          top,
          width: size,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          transform: flip ? 'scaleX(-1)' : undefined
        }}
      >
        {/* Spark trail */}
        <div className="absolute right-[78%] top-[55%] flex gap-1.5" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className="rounded-full bg-gold-300 animate-sparkFade"
              style={{
                width: s.size,
                height: s.size,
                animationDelay: `${s.delay}s`,
                '--driftY': `${s.drift}px`
              }}
            />
          ))}
        </div>

        <svg viewBox="0 0 400 220" width={size} height={size * 0.55} fill="none">
          <defs>
            <linearGradient id="dragonBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F2D98A" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#E8A317" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#C97A12" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="dragonWing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F2D98A" stopOpacity="0.18" />
            </linearGradient>
          </defs>

          <path d="M40 150 C 10 165, -10 145, 2 120 C 14 140, 30 140, 46 132" fill="url(#dragonBody)" />

          <g style={{ transformBox: 'fill-box', transformOrigin: '20% 60%' }} className="animate-flap" >
            <path
              d="M180 110 C 230 40, 300 20, 350 38 C 305 55, 270 80, 250 118 C 225 112, 200 112, 180 110 Z"
              fill="url(#dragonWing)"
            />
          </g>

          <path
            d="M60 132 C 110 150, 160 150, 195 128 C 225 110, 235 95, 260 92 C 245 105, 235 120, 235 135 C 215 150, 175 168, 130 162 C 95 158, 70 148, 60 132 Z"
            fill="url(#dragonBody)"
          />

          <g style={{ transformBox: 'fill-box', transformOrigin: '15% 70%' }} className="animate-flap">
            <path
              d="M160 118 C 200 55, 265 18, 330 22 C 290 48, 250 75, 232 122 C 208 118, 182 118, 160 118 Z"
              fill="url(#dragonWing)"
              stroke="#FFFFFF"
              strokeOpacity="0.25"
              strokeWidth="1.5"
            />
          </g>

          <path
            d="M255 95 C 275 80, 295 70, 320 72 C 335 73, 348 80, 356 92 C 345 90, 335 92, 328 98 C 336 100, 342 106, 344 114 C 332 110, 320 110, 310 116 C 296 110, 275 102, 255 95 Z"
            fill="url(#dragonBody)"
          />
          <path d="M320 72 C 322 58, 330 48, 342 44 C 334 56, 332 66, 332 76 Z" fill="url(#dragonBody)" />

          <path d="M150 128 L 158 112 L 166 130 Z" fill="#C97A12" fillOpacity="0.7" />
          <path d="M120 138 L 127 123 L 135 140 Z" fill="#C97A12" fillOpacity="0.7" />
          <path d="M90 142 L 96 128 L 104 144 Z" fill="#C97A12" fillOpacity="0.6" />
        </svg>
      </div>
    </div>
  )
}
