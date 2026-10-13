import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHomeHero } from '../api/sheetApi.js'
import MarqueeBanner from '../components/MarqueeBanner.jsx'
import Footer from '../components/Footer.jsx'
import AnnouncementBanner from '../components/AnnouncementBanner.jsx'
import HomeHero from '../components/HomeHero.jsx'
import StatusChips from '../components/StatusChips.jsx'
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

        {/* Mark attendance is the job people open the app for, so it gets the big card */}
        <HeroAction />

        <div className="grid grid-cols-2 gap-3 pb-2 mt-3">
          <Tile index={1} to="/qr-codes" title="QR codes" desc="Download an ID-card QR" tone="from-gold-500 to-gold-400" icon="qr" />
          <Tile index={2} to="/add-employee" title="Add employee" desc="ID, password and QR made for you" tone="from-brand-500 to-brand-700" icon="add" />
          <Tile index={3} to="/employee-login" title="My dashboard" desc="Your month, leave and QR" tone="from-brand-600 to-brand-800" icon="person" />
          <Tile index={4} to="/hr-login" title="HR admin" desc="Salary, leave and media" tone="from-ink to-brand-800" icon="shield" />
        </div>

        <Footer />
      </div>
    </div>
  )
}

// Small drawn icons. Each has a part that moves when the tile is touched (see .tile rules in index.css).
function TileIcon({ name }) {
  const p = { viewBox: '0 0 24 24', width: 26, height: 26, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (name === 'qr') {
    return (
      <svg {...p}>
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 20h2M20 14v2" />
        <path className="ico-scan" d="M3 12h18" strokeWidth="2.4" opacity="0" />
      </svg>
    )
  }
  if (name === 'add') {
    return (
      <svg {...p}>
        <g className="ico-plus"><path d="M12 5v14M5 12h14" /></g>
      </svg>
    )
  }
  if (name === 'person') {
    return (
      <svg {...p}>
        <circle className="ico-head" cx="12" cy="8" r="3.6" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      </svg>
    )
  }
  return (
    <svg {...p}>
      <path className="ico-shield" d="M12 3 4.5 6v6c0 4.3 3.1 7.5 7.5 9 4.4-1.5 7.5-4.7 7.5-9V6z" />
      <path className="ico-check" d="m8.8 12 2.3 2.3 4.2-4.4" />
    </svg>
  )
}

function useReveal(index) {
  const [ref, visible] = useScrollReveal()
  const style = { transitionDelay: visible ? `${index * 70}ms` : '0ms' }
  const cls = `transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`
  return [ref, style, cls]
}

function HeroAction() {
  const [ref, style, cls] = useReveal(0)
  return (
    <Link
      ref={ref}
      to="/attendance"
      style={style}
      className={`tile group sheen relative block overflow-hidden rounded-[1.75rem] p-5 text-white shadow-soft bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 ${cls}`}
    >
      <div className="absolute -right-10 -top-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-8 -bottom-14 w-40 h-40 rounded-full bg-gold-400/20 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-bold text-xl leading-tight">Mark attendance</p>
          <p className="text-brand-100 text-[13px] mt-1 max-w-[15rem]">Tap a status for each person, or let them scan their QR.</p>
        </div>
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 group-active:scale-90">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
            <path d="M8 2.5v4M16 2.5v4M3.5 10h17" />
            <path className="ico-check" d="m8.5 15 2.5 2.5 4.5-5" />
          </svg>
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between">
        <StatusChips />
        <span className="text-[11px] font-semibold text-white/80 group-hover:translate-x-1 transition-transform">Open</span>
      </div>
    </Link>
  )
}

function Tile({ to, title, desc, tone, icon, index }) {
  const [ref, style, cls] = useReveal(index)
  return (
    <Link
      ref={ref}
      to={to}
      style={style}
      className={`tile group sheen relative flex flex-col justify-between min-h-[8.5rem] overflow-hidden rounded-3xl p-4 text-white shadow-card bg-gradient-to-br ${tone} ${cls}`}
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="relative w-11 h-11 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110">
        <TileIcon name={icon} />
      </div>
      <div className="relative mt-4">
        <p className="font-display font-bold text-[15px] leading-tight">{title}</p>
        <p className="text-[11px] text-white/75 mt-1 leading-snug">{desc}</p>
      </div>
    </Link>
  )
}
