import React, { useEffect, useState } from 'react'

// Opens with the logo and expanding rings, then closes like a curtain onto the app.
export default function Splash({ onDone }) {
  const [hide, setHide] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setHide(true), 1000)
    const t2 = setTimeout(() => onDone && onDone(), 1560)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div
      className={`fixed sm:absolute inset-0 z-[100] overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 ${
        hide ? 'splash-exit pointer-events-none' : ''
      }`}
    >
      <span className="splash-ring" style={{ translate: '-50% -50%' }} />
      <span className="splash-ring" style={{ translate: '-50% -50%', animationDelay: '0.5s' }} />
      <img src="/logo.png" alt="Sridhi" className="relative w-20 h-20 rounded-3xl bg-white object-contain p-3 shadow-2xl animate-splashZoom" />
      <p className="relative text-white font-display font-bold text-lg mt-4 animate-fadeUp" style={{ animationDelay: '200ms' }}>
        Sridhi Ventures
      </p>
      <p className="relative text-brand-100 text-xs mt-1 animate-fadeUp" style={{ animationDelay: '300ms' }}>
        Attendance & Workforce Management
      </p>
    </div>
  )
}
