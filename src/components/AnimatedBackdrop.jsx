import React from 'react'

// Three blurred colour blobs that drift slowly behind the app.
// Fixed on phones, clipped inside the device frame on larger screens.
export default function AnimatedBackdrop() {
  return (
    <div aria-hidden="true" className="fixed sm:absolute inset-0 overflow-hidden pointer-events-none z-0">
      <span className="orb w-72 h-72 -top-16 -left-20 bg-brand-300/40" style={{ '--dx': '50px', '--dy': '60px', '--dur': '18s' }} />
      <span className="orb w-64 h-64 top-1/3 -right-24 bg-gold-400/25" style={{ '--dx': '-60px', '--dy': '-30px', '--dur': '22s' }} />
      <span className="orb w-80 h-80 -bottom-24 left-1/4 bg-brand-200/40" style={{ '--dx': '40px', '--dy': '-50px', '--dur': '26s' }} />
    </div>
  )
}
