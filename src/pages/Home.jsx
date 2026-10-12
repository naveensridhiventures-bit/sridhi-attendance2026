import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHomeHero } from '../api/sheetApi.js'
import MarqueeBanner from '../components/MarqueeBanner.jsx'
import Footer from '../components/Footer.jsx'
import AnnouncementBanner from '../components/AnnouncementBanner.jsx'
import HomeHero from '../components/HomeHero.jsx'
import useScrollReveal from '../hooks/useScrollReveal.js'

const HERO_CACHE = 'sv-home-hero'

// The last hero the admin published is remembered on the device, so the Home page
// opens with the right picture straight away instead of flashing the default first.
function readCachedHero() {
  try { return JSON.parse(localStorage.getItem(HERO_CACHE) || 'null') } catch (_) { return null }
}

export default function Home() {
  const [hero, setHero] = useState(readCachedHero)

  useEffect(() => {
    getHomeHero()
      .then((d) => {
        setHero(d.hero || null)
        try {
          if (d.hero) localStorage.setItem(HERO_CACHE, JSON.stringify(d.hero))
          else localStorage.removeItem(HERO_CACHE)
        } catch (_) { /* ignore */ }
      })
      .catch(() => {})
  }, [])

  return (
    <div>
      <HomeHero hero={hero} />

      <div className="px-5 -mt-6 max-w-md mx-auto relative z-10">
        <AnnouncementBanner />
        <MarqueeBanner
          items={[
            'Mark your attendance daily before 10:00 AM',
            'Use the QR Codes tab to download your ID card QR',
            'Apply for leave from your Employee Dashboard',
            'Production staff attendance is supervisor-marked'
          ]}
        />

        <div className="grid gap-3 pb-2 mt-1">
          <QuickLink icon="attendance" index={0} to="/attendance" title="Mark Attendance" desc="Mark P, H, A, WO, WOP or NA — or QR self check-in" color="from-brand-500 to-brand-600" />
          <QuickLink icon="qr" index={1} to="/qr-codes" title="Generate QR Code" desc="Download any employee's ID-card QR" color="from-gold-500 to-gold-400" />
          <QuickLink icon="add" index={2} to="/add-employee" title="Add New Employee" desc="Auto-generates Employee ID, password & QR" color="from-brand-600 to-brand-800" />
          <QuickLink icon="person" index={3} to="/employee-login" title="Employee Dashboard" desc="Your monthly attendance, leave & QR" color="from-brand-600 to-brand-800" />
          <QuickLink icon="shield" index={4} to="/hr-login" title="HR / Admin Dashboard" desc="Salary management & leave approvals" color="from-ink to-brand-800" />
        </div>

        <Footer />
      </div>
    </div>
  )
}

const ICONS = {
  attendance: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 11 2.5 2.5L16 12" />,
  qr: <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3z" />,
  add: <path d="M12 5v14M5 12h14" />,
  person: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0" />,
  shield: <path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6zM9 12l2.2 2.2L15.5 10" />
}

function QuickLink({ to, title, desc, color, icon = 'attendance', index = 0 }) {
  const [ref, visible] = useScrollReveal()
  return (
    <Link
      ref={ref}
      to={to}
      style={{ transitionDelay: visible ? `${index * 60}ms` : '0ms' }}
      className={`group sheen lift flex items-center gap-4 bg-white border border-brand-50 rounded-2xl p-4 shadow-card active:scale-[0.98] transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className={`relative w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-soft transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110`}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[icon]}
        </svg>
      </div>
      <div className="min-w-0">
        <p className="font-display font-semibold text-ink text-sm">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-brand-400 transition-transform duration-300 group-hover:translate-x-1.5">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  )
}
