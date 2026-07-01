import React, { useEffect, useState } from 'react'

export default function Splash({ onDone }) {
  const [hide, setHide] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setHide(true), 900)
    const t2 = setTimeout(() => onDone && onDone(), 1250)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 transition-opacity duration-300 ${
        hide ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <img src="/logo.png" alt="Sridhi" className="w-20 h-20 rounded-3xl bg-white object-contain p-3 shadow-2xl animate-splashZoom" />
      <p className="text-white font-display font-bold text-lg mt-4 animate-fadeUp" style={{ animationDelay: '200ms' }}>
        Sridhi Battery Co.
      </p>
      <p className="text-brand-100 text-xs mt-1 animate-fadeUp" style={{ animationDelay: '300ms' }}>
        Attendance & Workforce Management
      </p>
    </div>
  )
}
