import React, { useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

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

const DASH_ROUTES = ['/dashboard-login', '/employee-login', '/hr-login', '/employee-dashboard', '/hr-dashboard']

function activeIndex(pathname) {
  if (pathname === '/') return 0
  if (pathname.startsWith('/attendance')) return 1
  if (pathname.startsWith('/qr-codes')) return 2
  if (DASH_ROUTES.some((r) => pathname.startsWith(r))) return 3
  return -1
}

export default function BottomNav() {
  const { pathname } = useLocation()
  const idx = activeIndex(pathname)
  const prev = useRef(idx)
  const stretch = 1 + Math.min(Math.abs(idx - prev.current), 3) * 0.28
  prev.current = idx
  return (
    <nav className="fixed sm:absolute bottom-0 inset-x-0 z-40 px-4 pb-3 safe-bottom pointer-events-none">
      <div className="max-w-md mx-auto bg-ink/95 backdrop-blur-xl rounded-[1.75rem] shadow-[0_10px_30px_-6px_rgba(9,61,31,0.55)] border border-white/5 pointer-events-auto">
        <div className="relative grid grid-cols-4 px-1.5 py-1.5">
          {/* One gradient pill that glides to the active tab, stretching like liquid as it travels */}
          <span
            aria-hidden="true"
            className="nav-pill absolute top-1.5 bottom-1.5 left-1.5 pointer-events-none"
            style={{ width: 'calc((100% - 0.75rem) / 4)', transform: `translateX(${Math.max(idx, 0) * 100}%)`, opacity: idx < 0 ? 0 : 1 }}
          >
            <span
              key={idx}
              style={{ '--stretch': stretch }}
              className="pill-blob block w-full h-full rounded-2xl bg-gradient-to-br from-brand-500/35 to-brand-700/20 ring-1 ring-brand-400/30"
            />
          </span>
          {tabs.map((t, i) => (
            <NavLink
              key={t.to}
              to={t.to}
              className="relative flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-semibold"
            >
              <span
                key={idx === i ? 'on' : 'off'}
                className={`flex items-center justify-center w-10 h-8 rounded-xl transition-[background,box-shadow,color] duration-500 ${
                  idx === i ? 'icon-pop bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-soft -translate-y-0.5' : 'text-slate-400'
                }`}
              >
                {t.icon}
              </span>
              <span className={`transition-colors duration-300 ${idx === i ? 'text-white' : 'text-slate-500'}`}>{t.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
