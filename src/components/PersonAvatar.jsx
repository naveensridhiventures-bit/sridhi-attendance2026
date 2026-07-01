import React from 'react'

// A professional photo-avatar treatment: real photo in a glowing ring,
// gently floating, with an animated "Present" confirmation badge and
// orbiting sparkle accents — replaces the illustrated character.
export default function PersonAvatar({ size = 150, side = 'right' }) {
  const isRight = side === 'right'
  return (
    <div
      className={`absolute -top-2 ${isRight ? 'right-1' : 'left-1'} pointer-events-none motion-reduce:hidden animate-avatarFloat`}
      style={{ width: size }}
      aria-hidden="true"
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glowing ring */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-gold-300 via-brand-200 to-gold-300 opacity-70 blur-md animate-avatarGlow" />

        {/* Rotating dashed ring (circuit motif) */}
        <svg className="absolute -inset-1.5" viewBox="0 0 100 100" style={{ width: size + 12, height: size + 12 }}>
          <circle cx="50" cy="50" r="47" fill="none" stroke="#F2D98A" strokeWidth="2" strokeDasharray="6 8" className="animate-ringSpin" style={{ transformOrigin: '50% 50%' }} />
        </svg>

        {/* Photo */}
        <div className="absolute inset-0 rounded-full overflow-hidden border-[3px] border-white shadow-xl">
          <img src="/team-photo.jpg" alt="Team member marking attendance" className="w-full h-full object-cover" />
        </div>

        {/* Present badge */}
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg animate-popIn" style={{ animationDelay: '0.4s' }}>
          <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" strokeWidth="3">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" className="animate-checkDraw" />
            </svg>
          </div>
        </div>

        {/* Sparkles */}
        <span className="absolute -top-2 left-1 w-2 h-2 rounded-full bg-gold-300 animate-sparkleFloat" />
        <span className="absolute top-3 -left-3 w-1.5 h-1.5 rounded-full bg-white animate-sparkleFloat" style={{ animationDelay: '0.5s' }} />
      </div>
    </div>
  )
}
