import React from 'react'

export default function TopBar({ eyebrow, title, subtitle }) {
  return (
    <header className="mb-5 animate-fadeUp">
      <div className="flex items-center gap-3 mb-3">
        <img src="/logo.png" alt="Sridhi" className="w-10 h-10 rounded-xl object-contain bg-white shadow-card p-1" />
        <div>
          <p className="text-brand-600 text-[11px] font-semibold tracking-widest uppercase">{eyebrow}</p>
          <h1 className="font-display text-xl font-bold text-ink leading-tight">{title}</h1>
        </div>
      </div>
      {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
    </header>
  )
}
