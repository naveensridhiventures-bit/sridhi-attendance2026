import React, { useRef } from 'react'

// Wraps any card content with a subtle 3D tilt that follows the pointer/finger,
// plus a soft glare sweep — gives flat cards (like the QR code) real depth.
export default function TiltCard({ children, className = '', maxTilt = 10 }) {
  const ref = useRef(null)
  const glareRef = useRef(null)

  function handleMove(e) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const point = e.touches ? e.touches[0] : e
    const x = (point.clientX - rect.left) / rect.width
    const y = (point.clientY - rect.top) / rect.height
    const rotateY = (x - 0.5) * maxTilt * 2
    const rotateX = (0.5 - y) * maxTilt * 2
    el.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.35), transparent 55%)`
    }
  }

  function handleLeave() {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)'
    if (glareRef.current) glareRef.current.style.background = 'transparent'
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onTouchMove={handleMove}
      onTouchEnd={handleLeave}
      className={`relative transition-transform duration-150 ease-out will-change-transform ${className}`}
    >
      {children}
      <div ref={glareRef} className="absolute inset-0 rounded-[inherit] pointer-events-none transition-colors duration-150" />
    </div>
  )
}
