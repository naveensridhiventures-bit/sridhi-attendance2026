import React from 'react'
import { NavLink } from 'react-router-dom'

const tabs = [
  {
    to: '/',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    to: '/attendance',
    label: 'Attendance',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round" />
        <path d="m8 15 2.5 2.5L16 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    to: '/qr-codes',
    label: 'QR Codes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 21h3M21 14v3" />
      </svg>
    )
  },
  {
    to: '/dashboard-login',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
      </svg>
    )
  }
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 px-4 pb-3 safe-bottom pointer-events-none">
      <div className="max-w-md mx-auto bg-ink/95 backdrop-blur-xl rounded-[1.75rem] shadow-[0_10px_30px_-6px_rgba(9,61,31,0.55)] border border-white/5 pointer-events-auto">
        <div className="grid grid-cols-4 px-1.5 py-1.5">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-semibold transition-all duration-300"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-300 ${
                      isActive ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-soft scale-105' : 'text-slate-400'
                    }`}
                  >
                    {t.icon}
                  </span>
                  <span className={isActive ? 'text-white' : 'text-slate-500'}>{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
