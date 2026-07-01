import React from 'react'

// A smooth, professional auto-scrolling announcement strip for the Home page.
export default function MarqueeBanner({ items = [] }) {
  const doubled = [...items, ...items]
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 py-2.5 mb-5 shadow-soft marquee-mask">
      <div className="marquee-track">
        {doubled.map((text, i) => (
          <span key={i} className="text-white text-xs font-medium px-6 whitespace-nowrap flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
