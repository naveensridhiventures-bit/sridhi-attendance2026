import React from 'react'

// A friendly, professional flat-illustration character holding a tablet,
// happily checking off attendance — replaces the kaiju with something
// warmer and more on-message for an HR/workforce tool.
export default function HappyAttendance({ size = 260, side = 'right' }) {
  const isRight = side === 'right'
  return (
    <div
      className={`absolute -bottom-2 ${isRight ? '-right-2' : '-left-2'} pointer-events-none motion-reduce:hidden origin-bottom animate-personBob`}
      style={{ width: size, transform: isRight ? undefined : 'scaleX(-1)' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 220 260" width={size} height={size * 1.18} fill="none" style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.18))' }}>
        <defs>
          <linearGradient id="shirtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#45BE63" />
            <stop offset="100%" stopColor="#147F3D" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="100" cy="252" rx="58" ry="8" fill="#0E2418" opacity="0.08" />

        {/* Legs */}
        <rect x="76" y="178" width="18" height="62" rx="8" fill="#16211C" />
        <rect x="108" y="178" width="18" height="62" rx="8" fill="#16211C" />
        <rect x="70" y="232" width="30" height="12" rx="6" fill="#0A120E" />
        <rect x="102" y="232" width="30" height="12" rx="6" fill="#0A120E" />

        {/* Body / shirt */}
        <path d="M68 120 C 68 96, 84 80, 104 80 C 124 80, 140 96, 140 120 L 144 186 C 144 196, 134 202, 124 202 L 84 202 C 74 202, 64 196, 64 186 Z" fill="url(#shirtGrad)" />
        {/* Collar */}
        <path d="M92 84 L 104 100 L 116 84" fill="none" stroke="#0F6630" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Left arm holding tablet (static) */}
        <path d="M70 110 C 54 116, 44 130, 44 148 L 60 152 C 60 138, 66 126, 76 120 Z" fill="url(#shirtGrad)" />

        {/* Right arm waving */}
        <g style={{ transformBox: 'fill-box', transformOrigin: '0% 100%' }} className="animate-armWave">
          <path d="M134 112 C 150 108, 162 96, 166 80 L 150 74 C 148 88, 140 98, 128 104 Z" fill="url(#shirtGrad)" />
          {/* hand */}
          <circle cx="160" cy="72" r="9" fill="#F2C9A0" />
        </g>

        {/* Head */}
        <circle cx="104" cy="58" r="30" fill="#F2C9A0" />
        {/* Hair */}
        <path d="M76 50 C 74 30, 90 16, 106 16 C 124 16, 138 30, 136 50 C 130 40, 120 34, 108 34 C 96 34, 84 40, 76 50 Z" fill="#2B1D14" />
        {/* Face: eyes + smile */}
        <circle cx="94" cy="58" r="2.6" fill="#16211C" className="animate-personBlink" />
        <circle cx="116" cy="58" r="2.6" fill="#16211C" className="animate-personBlink" />
        <path d="M92 70 C 98 76, 110 76, 116 70" stroke="#A8623F" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <circle cx="84" cy="64" r="4" fill="#F2A37A" opacity="0.5" />
        <circle cx="126" cy="64" r="4" fill="#F2A37A" opacity="0.5" />

        {/* Tablet in left hand */}
        <g transform="translate(20,128) rotate(-8)">
          <rect x="0" y="0" width="46" height="60" rx="6" fill="#0E2418" />
          <rect x="4" y="5" width="38" height="50" rx="3" fill="#FFFFFF" />
          <rect x="9" y="12" width="28" height="3" rx="1.5" fill="#D7F4DD" />
          <rect x="9" y="19" width="20" height="3" rx="1.5" fill="#D7F4DD" />
          {/* animated checkmark */}
          <path
            d="M12 32 L 20 40 L 35 24"
            stroke="#1F9D4C"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="30"
            className="animate-tabletCheck"
          />
        </g>

        {/* Floating sparkle confirmation */}
        <g className="animate-sparkleFloat">
          <path d="M170 40 L 172 46 L 178 48 L 172 50 L 170 56 L 168 50 L 162 48 L 168 46 Z" fill="#F2B544" />
        </g>
        <g className="animate-sparkleFloat" style={{ animationDelay: '0.6s' }}>
          <circle cx="40" cy="100" r="2.5" fill="#F2D98A" />
        </g>
      </svg>
    </div>
  )
}
