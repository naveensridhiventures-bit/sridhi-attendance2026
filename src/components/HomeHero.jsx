import React, { useEffect, useState } from 'react'
import DarkModeToggle from './DarkModeToggle.jsx'
import HeroEffects, { SPEED_MUL } from './HeroEffects.jsx'

// The media layer behind the hero: the admin's video or photo, or the built-in dragon video.
// Photos get the motion style the admin chose. If the file can't load (bad link, private Drive file)
// it quietly falls back to the default.
export function HeroMedia({ hero, onFail }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [hero?.url])

  function fail() {
    setFailed(true)
    if (onFail) onFail()
  }

  const custom = hero?.url && (hero.type === 'video' || hero.type === 'image') && !failed

  if (!custom) {
    return (
      <video
        key="default"
        className="absolute inset-0 w-full h-full object-cover"
        src="/dragon-bg.mp4"
        poster="/dragon-bg-poster.jpg"
        autoPlay loop muted playsInline preload="auto"
      />
    )
  }

  if (hero.type === 'image') {
    // Photos saved before animations existed keep the slow zoom
    const anim = hero.animation === undefined ? 'zoom' : hero.animation
    const spd = SPEED_MUL[hero.speed] ?? 1
    return (
      <div
        key={`${hero.url}-${anim}`}
        className={`absolute inset-0 overflow-hidden ${anim === 'reveal' ? 'hero-wipe' : 'media-in'}`}
        style={{ '--spd': spd }}
      >
        <img
          src={hero.url}
          alt=""
          onError={fail}
          className={`absolute inset-0 w-full h-full object-cover ${anim && anim !== 'none' ? `hero-anim hero-anim-${anim}` : ''}`}
        />
      </div>
    )
  }

  return (
    <video
      key={hero.url}
      className="absolute inset-0 w-full h-full object-cover media-in"
      src={hero.url}
      poster={hero.poster || undefined}
      onError={fail}
      autoPlay loop muted playsInline preload="auto"
    />
  )
}

// The full hero block used on the Home page. `preview` renders the same thing smaller for the admin screen.
// `headline` / `subtext` override the saved values so the admin sees edits live before publishing.
export default function HomeHero({ hero, headline, subtext, preview = false, onMediaFail }) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const title = (headline ?? hero?.headline) || 'Welcome back'
  const body = (subtext ?? hero?.subtext) || ''

  return (
    <div
      className={`relative overflow-hidden bg-brand-800 shadow-soft ${
        preview ? 'rounded-3xl min-h-[15rem] px-4 pt-5 pb-6' : 'rounded-b-[2rem] px-5 pt-8 pb-10'
      }`}
    >
      <HeroMedia hero={hero} onFail={onMediaFail} />
      {/* Legibility overlays: darken left/bottom for text, let the picture breathe top-right */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink/80 via-ink/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-brand-900/90 to-transparent" />
      <HeroEffects effects={hero?.effects} speed={hero?.speed} />
      <div className={`relative max-w-md mx-auto ${preview ? '' : 'animate-fadeUp'}`}>
        <div className="flex items-center gap-3 mb-3">
          <img
            src="/logo.png"
            alt="Sridhi"
            className={`${preview ? 'w-10 h-10' : 'w-12 h-12'} rounded-2xl bg-white object-contain p-1.5 shadow-lg animate-breatheGlow`}
          />
          <div className="min-w-0">
            <p className="text-white font-display font-bold text-base leading-tight">Sridhi Ventures</p>
            <p className="text-brand-100 text-[11px]">Attendance & Workforce Management</p>
          </div>
          {!preview && <DarkModeToggle className="ml-auto" />}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          <span className="text-brand-50 text-[11px] font-semibold tracking-widest uppercase">Live System</span>
        </div>
        <p className="text-brand-50 text-sm">{today}</p>
        <h1 className="font-display text-2xl font-bold text-white mt-1 leading-snug break-words">
          <ShimmerText text={title} />
        </h1>
        {body && (
          <p className="mt-2 text-[13px] leading-relaxed text-brand-50/90 whitespace-pre-line break-words max-w-[26rem] animate-fadeUp">
            {body}
          </p>
        )}
      </div>
    </div>
  )
}

// Shimmer only the words — a gradient clipped to text turns emoji into pale blobs, so emoji stay in full colour.
function ShimmerText({ text }) {
  const parts = text.split(/(\p{Extended_Pictographic}(?:‍\p{Extended_Pictographic}|️)*)/u).filter(Boolean)
  return parts.map((part, i) =>
    /\p{Extended_Pictographic}/u.test(part) ? <span key={i}>{part}</span> : <span key={i} className="text-shimmer">{part}</span>
  )
}
