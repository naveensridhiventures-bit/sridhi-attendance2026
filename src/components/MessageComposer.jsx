import React, { useEffect, useState } from 'react'
import { getAnnouncement, setAnnouncement, clearAnnouncement } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'

const TYPES = [
  { key: 'announcement', label: 'Announcement', icon: '📢', color: 'from-brand-500 to-brand-700' },
  { key: 'birthday',     label: 'Birthday',     icon: '🎂', color: 'from-purple-500 to-pink-600' },
  { key: 'festival',     label: 'Festival',     icon: '🎉', color: 'from-orange-400 to-red-600' },
  { key: 'holiday',      label: 'Holiday',      icon: '🏖️', color: 'from-sky-400 to-blue-600' },
  { key: 'alert',        label: 'Alert',        icon: '⚠️', color: 'from-amber-400 to-orange-600' }
]

const QUICK = [
  { label: '🎂 Birthday', fill: 'Wishing [Name] a very Happy Birthday! 🎉 May this year bring you lots of joy and success.' },
  { label: '🏖️ Holiday',  fill: 'Tomorrow is a public holiday. Office will be closed. Enjoy the break! 🌟' },
  { label: '📢 Meeting',  fill: 'Reminder: All staff meeting at [time] in the conference room. Please be on time.' },
  { label: '🎊 Festival', fill: 'Wishing everyone a Happy [Festival]! 🎊 The office will be closed on [date].' }
]

export default function MessageComposer({ hrName }) {
  const showToast = useToast()
  const [type, setType] = useState('announcement')
  const [message, setMessage] = useState('')
  const [posting, setPosting] = useState(false)
  const [current, setCurrent] = useState(null)
  const [loadingCurrent, setLoadingCurrent] = useState(true)

  useEffect(() => {
    getAnnouncement()
      .then((r) => { if (r.announcement?.message) setCurrent(r.announcement) })
      .catch(() => {})
      .finally(() => setLoadingCurrent(false))
  }, [])

  async function handlePost() {
    if (!message.trim()) {
      showToast('Please type a message first.', 'error')
      return
    }
    setPosting(true)
    try {
      await setAnnouncement(message.trim(), type, hrName || 'HR')
      setCurrent({ message: message.trim(), type, authorName: hrName || 'HR', postedAt: new Date().toISOString() })
      setMessage('')
      showToast('Message published to Home page! 🎉', 'success')
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    } finally {
      setPosting(false)
    }
  }

  async function handleClear() {
    try {
      await clearAnnouncement()
      setCurrent(null)
      showToast('Announcement cleared from Home page.', 'info')
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    }
  }

  const selectedType = TYPES.find((t) => t.key === type)

  return (
    <div className="space-y-4">
      {/* Current live message */}
      {loadingCurrent ? (
        <div className="h-20 rounded-2xl skeleton" />
      ) : current ? (
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
          <p className="text-[10px] text-white/60 uppercase tracking-widest mb-1">Live on Home page</p>
          <p className="text-white font-semibold text-sm">{current.message}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-white/50 text-[10px]">by {current.authorName}</span>
            <button onClick={handleClear} className="text-[11px] bg-white/15 text-white rounded-lg px-3 py-1 font-semibold hover:bg-white/25 transition-colors">
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-brand-200 p-4 text-center text-sm text-slate-400">
          No active announcement — Home page shows default content
        </div>
      )}

      {/* Composer */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card space-y-4">
        <p className="font-display font-semibold text-ink text-sm">Post New Message</p>

        {/* Type selector */}
        <div>
          <label className="block text-[11px] text-slate-400 mb-2 uppercase tracking-wide font-medium">Message Type</label>
          <div className="grid grid-cols-5 gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border text-[10px] font-semibold transition-all ${
                  type === t.key
                    ? `bg-gradient-to-br ${t.color} text-white border-transparent shadow-soft scale-105`
                    : 'bg-surface text-slate-500 border-brand-100'
                }`}
              >
                <span className="text-base">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick fill */}
        <div>
          <label className="block text-[11px] text-slate-400 mb-2 uppercase tracking-wide font-medium">Quick Templates</label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q.label}
                onClick={() => setMessage(q.fill)}
                className="text-[11px] bg-brand-50 text-brand-700 border border-brand-100 rounded-full px-3 py-1 font-medium hover:bg-brand-100 transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message textarea */}
        <div>
          <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Your Message</label>
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder={`Type your ${selectedType?.label.toLowerCase()} message here…`}
              className="input resize-none"
            />
            <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400">{message.length}/200</span>
          </div>
        </div>

        {/* Preview */}
        {message && (
          <div className={`rounded-2xl bg-gradient-to-br ${selectedType?.color} p-3.5 relative overflow-hidden`}>
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/10" />
            <p className="text-[9px] text-white/60 uppercase tracking-widest mb-1">Preview</p>
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedType?.icon}</span>
              <p className="text-white font-semibold text-sm leading-snug">{message}</p>
            </div>
          </div>
        )}

        <button onClick={handlePost} disabled={posting} className="w-full btn-primary py-3 text-sm">
          {posting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" /></svg>
              Publishing…
            </span>
          ) : `${selectedType?.icon} Publish to Home Page`}
        </button>
      </div>
    </div>
  )
}
