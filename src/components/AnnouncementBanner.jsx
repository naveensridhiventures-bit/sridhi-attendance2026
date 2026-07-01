import React, { useEffect, useState } from 'react'
import { getAnnouncement } from '../api/sheetApi.js'

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

  const cfg = TYPE_CONFIG[data.type] || TYPE_CONFIG.announcement
  const timeAgo = data.postedAt ? getTimeAgo(data.postedAt) : ''

  return (
    <div
      className={`relative rounded-3xl bg-gradient-to-br ${cfg.gradient} p-5 mb-4 overflow-hidden animate-popIn shadow-lg`}
      style={{ boxShadow: `0 8px 32px -4px ${cfg.glow}` }}
    >
      {/* Bokeh blobs */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-sm" />
      <div className="absolute -left-4 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-sm" />

      {/* Animated sparkles */}
      {SPARKLE_POSITIONS.map((s, i) => (
        <SparkleIcon key={i} size={s.size} delay={s.delay} style={{
          top: s.top, left: s.left, right: s.right, bottom: s.bottom
        }} />
      ))}

      {/* Moving shimmer streak */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmerStreak" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Icon bubble */}
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner border border-white/25 animate-iconBounce">
              {cfg.icon}
            </div>

            <div className="min-w-0">
              {/* Label + time */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{cfg.label}</span>
                {timeAgo && <span className="text-[10px] text-white/50">· {timeAgo}</span>}
              </div>

              {/* Message */}
              <p className="text-white font-display font-semibold text-base leading-snug">
                {data.message}
              </p>

              {/* Author */}
              {data.authorName && (
                <p className="text-white/60 text-[11px] mt-1.5 flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-white/25 inline-flex items-center justify-center text-[8px]">HR</span>
                  {data.authorName}
                </p>
              )}
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white/70 hover:bg-white/25 transition-colors mt-0.5"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
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
