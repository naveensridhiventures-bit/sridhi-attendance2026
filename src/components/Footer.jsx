import React from 'react'

export default function Footer() {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-[11px] text-slate-400">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3 4 6.5v5c0 4.5 3.4 8.7 8 10 4.6-1.3 8-5.5 8-10v-5L12 3Z" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Powered by <span className="font-semibold text-brand-600">Sridhi Ventures</span>
    </div>
  )
}
