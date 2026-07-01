import React from 'react'

// Wraps a card with an animated dashed border that looks like current
// traveling around a circuit trace — a brand-true highlight effect.
export default function CircuitBorder({ children, radius = 24, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ borderRadius: radius }}>
        <rect
          x="1.5"
          y="1.5"
          width="calc(100% - 3px)"
          height="calc(100% - 3px)"
          rx={radius - 2}
          fill="none"
          stroke="#1F9D4C"
          strokeOpacity="0.18"
          strokeWidth="2"
        />
        <rect
          x="1.5"
          y="1.5"
          width="calc(100% - 3px)"
          height="calc(100% - 3px)"
          rx={radius - 2}
          fill="none"
          stroke="#F2B544"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="18 130"
          className="animate-circuitFlow"
        />
      </svg>
      <div className="relative">{children}</div>
    </div>
  )
}
