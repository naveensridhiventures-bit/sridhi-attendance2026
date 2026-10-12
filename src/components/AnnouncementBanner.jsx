import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getAnnouncement } from '../api/sheetApi.js'
import RichText from './RichText.jsx'

const TYPE_CONFIG = {
  announcement: {
    gradient: 'from-brand-600 to-brand-800',
    glow: 'rgba(31,157,76,0.4)',
    icon: '📢',
    label: 'Announcement',
    accent: '#F2D98A'
  },
  birthday: {
    gradient: 'from-purple-600 to-pink-600',
    glow: 'rgba(168,85,247,0.4)',
    icon: '🎂',
    label: 'Birthday',
    accent: '#FDE68A'
  },
  festival: {
    gradient: 'from-orange-500 to-red-600',
    glow: 'rgba(234,88,12,0.4)',
    icon: '🎉',
    label: 'Festival',
    accent: '#FDE68A'
  },
  alert: {
    gradient: 'from-amber-500 to-orange-600',
    glow: 'rgba(245,158,11,0.4)',
    icon: '⚠️',
    label: 'Alert',
    accent: '#FFFFFF'
  },
  holiday: {
    gradient: 'from-sky-500 to-blue-700',
    glow: 'rgba(14,165,233,0.4)',
    icon: '🏖️',
    label: 'Holiday',
    accent: '#FDE68A'
  }
}

const SPARKLE_POSITIONS = [
  { top: '8%', left: '4%', size: 8, delay: '0s' },
  { top: '18%', right: '6%', size: 6, delay: '0.4s' },
  { bottom: '12%', left: '8%', size: 5, delay: '0.7s' },
  { bottom: '8%', right: '12%', size: 7, delay: '0.2s' },
  { top: '40%', right: '3%', size: 4, delay: '1s' }
]

function SparkleIcon({ size, delay, style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="#F2D98A"
      className="absolute animate-sparkleFloat"
      style={{ animationDelay: delay, ...style }}
    >
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
}

const COLLAPSED_PX = 150

// The message card. Long messages open collapsed with a soft fade and a "Read more" button.
// `preview` is used by the admin screen: same look, no dismiss button.
export function AnnouncementCard({ data, onDismiss, preview = false }) {
  const cfg = TYPE_CONFIG[data.type] || TYPE_CONFIG.announcement
  const timeAgo = data.postedAt ? getTimeAgo(data.postedAt) : ''
  const innerRef = useRef(null)
  const [full, setFull] = useState(0)
  const [open, setOpen] = useState(false)

  // Measure the real text height (and keep it right when fonts load or the screen is resized)
  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return undefined
    const measure = () => setFull(el.offsetHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [data.message, data.title])

  const overflow = full > COLLAPSED_PX + 30
  const shown = !overflow || open ? full : COLLAPSED_PX

  return (
    <div
      className={`relative rounded-3xl bg-gradient-to-br ${cfg.gradient} p-5 mb-4 overflow-hidden ${preview ? '' : 'animate-popIn'} shadow-lg`}
      style={{ boxShadow: `0 8px 32px -4px ${cfg.glow}` }}
    >
      {/* Bokeh blobs */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-sm" />
      <div className="absolute -left-4 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-sm" />

      {/* Animated sparkles */}
      {SPARKLE_POSITIONS.map((sp, i) => (
        <SparkleIcon key={i} size={sp.size} delay={sp.delay} style={{ top: sp.top, left: sp.left, right: sp.right, bottom: sp.bottom }} />
      ))}

      {/* Moving shimmer streak */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmerStreak" />

      <div className="relative z-10">
        {/* Header: icon, type, time, dismiss */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner border border-white/25 animate-iconBounce">
              {cfg.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/75">{cfg.label}</p>
              {timeAgo && <p className="text-[10px] text-white/55">{timeAgo}</p>}
            </div>
          </div>
          {!preview && onDismiss && (
            <button
              onClick={onDismiss}
              aria-label="Dismiss message"
              className="shrink-0 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white/70 hover:bg-white/25 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Title + body */}
        <div
          className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
          style={{ maxHeight: full ? shown : undefined }}
        >
          <div ref={innerRef}>
            {data.title && <h3 className="text-white font-display font-bold text-xl leading-tight mb-2.5 break-words">{data.title}</h3>}
            <RichText text={data.message} className="text-white/95 text-[15px] leading-relaxed" />
          </div>
          {overflow && !open && (
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          )}
        </div>

        {overflow && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3.5 py-1.5 transition-colors"
          >
            {open ? 'Show less' : 'Read more'}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}

        {data.authorName && (
          <p className="text-white/65 text-[11px] mt-3 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-white/25 inline-flex items-center justify-center text-[8px] font-bold">HR</span>
            Posted by {data.authorName}
          </p>
        )}
      </div>
    </div>
  )
}

export default function AnnouncementBanner() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    getAnnouncement()
      .then((res) => {
        if (res.announcement?.message) setData(res.announcement)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data || dismissed) return null
  return <AnnouncementCard data={data} onDismiss={() => setDismissed(true)} />
}

function getTimeAgo(postedAt) {
  try {
    const diff = Date.now() - new Date(postedAt).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 2) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  } catch { return '' }
}
