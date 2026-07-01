import React from 'react'
import { Link } from 'react-router-dom'

export default function DashboardChooser() {
  return (
    <div className="px-5 pt-10 max-w-md mx-auto">
      <div className="text-center mb-8 animate-fadeUp">
        <img src="/logo.png" alt="Sridhi" className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-soft object-contain p-2 mb-3" />
        <p className="text-brand-600 text-xs font-semibold tracking-widest uppercase">Secure Access</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1">Choose Your Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Employees and HR/Admin sign in separately, each to their own panel.</p>
      </div>

      <div className="space-y-3.5">
        <Link
          to="/employee-login"
          className="group flex items-center gap-4 bg-white border border-brand-50 rounded-2xl p-5 shadow-card active:scale-[0.98] transition-transform animate-popIn"
        >
          <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-ink">Employee Dashboard</p>
            <p className="text-xs text-slate-500 mt-0.5">View your monthly attendance, apply for leave, download your QR</p>
          </div>
          <span className="ml-auto text-brand-400 group-active:translate-x-0.5 transition-transform">→</span>
        </Link>

        <Link
          to="/hr-login"
          className="group flex items-center gap-4 bg-white border border-brand-50 rounded-2xl p-5 shadow-card active:scale-[0.98] transition-transform animate-popIn"
          style={{ animationDelay: '80ms' }}
        >
          <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-ink to-brand-800 flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M7 9h10M7 13h6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-ink">HR / Admin Dashboard</p>
            <p className="text-xs text-slate-500 mt-0.5">Manage employee salary and approve leave & permission requests</p>
          </div>
          <span className="ml-auto text-brand-400 group-active:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>
    </div>
  )
}
