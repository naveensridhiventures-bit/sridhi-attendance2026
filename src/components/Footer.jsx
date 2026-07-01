import React from 'react'

export default function Footer() {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-[11px] text-slate-400">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="18" height="10" rx="2" />
        <path d="M22 10v4" strokeLinecap="round" />
        <path d="M6 10v4M10 10v4" strokeLinecap="round" className="text-brand-400" stroke="currentColor" />
      </svg>
      Powered by <span className="font-semibold text-brand-600">Sridhi Attendace.</span>
    </div>
  )
}
