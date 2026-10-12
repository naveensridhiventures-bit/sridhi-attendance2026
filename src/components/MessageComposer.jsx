import React, { useEffect, useState } from 'react'
import { getAnnouncement, publishAnnouncement, clearAnnouncement } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'
import { AnnouncementCard } from './AnnouncementBanner.jsx'

const MAX_CHARS = 20000

const TYPES = [
  { key: 'announcement', label: 'Announcement', icon: '📢', color: 'from-brand-500 to-brand-700' },
  { key: 'birthday',     label: 'Birthday',     icon: '🎂', color: 'from-purple-500 to-pink-600' },
  { key: 'festival',     label: 'Festival',     icon: '🎉', color: 'from-orange-400 to-red-600' },
  { key: 'holiday',      label: 'Holiday',      icon: '🏖️', color: 'from-sky-400 to-blue-600' },
  { key: 'alert',        label: 'Alert',        icon: '⚠️', color: 'from-amber-400 to-orange-600' }
]

// Each template fills a title and a structured body the admin can edit
const QUICK = [
  {
    label: '🎂 Birthday', type: 'birthday', title: 'Happy Birthday, [Name]! 🎉',
    body: 'Wishing you a wonderful year ahead full of joy, health and success.\n\nCome to the pantry at [time] to share the cake with the team.'
  },
  {
    label: '🏖️ Holiday', type: 'holiday', title: 'Office closed on [date]',
    body: 'The office will be closed for [occasion].\n\n# What to remember\n- Normal work resumes on [date]\n- Production staff: check with your supervisor for shifts\n- Urgent matters: call HR on [number]\n\nEnjoy the break! 🌟'
  },
  {
    label: '📢 Meeting', type: 'announcement', title: 'All-staff meeting',
    body: 'Please join us for an important meeting.\n\n- **When:** [date], [time]\n- **Where:** Conference room\n- **Who:** All office staff\n\nPlease be on time and bring your questions.'
  },
  {
    label: '🎊 Festival', type: 'festival', title: 'Happy [Festival]! 🎊',
    body: 'Wishing you and your family a joyful festival.\n\n1. Office closed on [date]\n2. Festival bonus will be credited on [date]\n3. Sweets for everyone at the front desk 🍬'
  }
]

export default function MessageComposer({ hrName }) {
  const showToast = useToast()
  const [type, setType] = useState('announcement')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [posting, setPosting] = useState(false)
  const [progress, setProgress] = useState(null) // { done, total }
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
    setProgress(null)
    try {
      await publishAnnouncement(
        { title, message, type, authorName: hrName || 'HR' },
        (done, total) => setProgress(total > 1 ? { done, total } : null)
      )
      setCurrent({ title: title.trim(), message: message.trim(), type, authorName: hrName || 'HR', postedAt: new Date().toISOString() })
      setTitle('')
      setMessage('')
      showToast('Message published to Home page! 🎉', 'success')
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    } finally {
      setPosting(false)
      setProgress(null)
    }
  }

  async function handleClear() {
    try {
      await clearAnnouncement()
      setCurrent(null)
      showToast('Message cleared from Home page.', 'info')
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    }
  }

  function applyTemplate(q) {
    setType(q.type)
    setTitle(q.title)
    setMessage(q.body)
  }

  const selectedType = TYPES.find((t) => t.key === type)
  const words = message.trim() ? message.trim().split(/\s+/).length : 0
  const lines = message ? message.split('\n').length : 0
  const nearLimit = message.length > MAX_CHARS * 0.9

  return (
    <div className="space-y-4">
      {/* Current live message — shown exactly as everyone sees it */}
      {loadingCurrent ? (
        <div className="h-20 rounded-2xl skeleton" />
      ) : current ? (
        <div className="rise" style={{ '--i': 0 }}>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="font-display font-semibold text-ink text-sm">Live on Home page</p>
            <button onClick={handleClear} className="text-[11px] bg-rust/10 text-rust rounded-lg px-3 py-1 font-semibold">
              Clear
            </button>
          </div>
          <AnnouncementCard data={current} preview />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-brand-200 p-4 text-center text-sm text-slate-400">
          No message right now — the Home page shows its default content
        </div>
      )}

      {/* Composer */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card space-y-4 rise" style={{ '--i': 1 }}>
        <p className="font-display font-semibold text-ink text-sm">Write a Home page message</p>

        {/* Type selector */}
        <div>
          <p className="text-xs font-semibold text-ink mb-2">Style</p>
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

        {/* Quick templates */}
        <div>
          <p className="text-xs font-semibold text-ink mb-2">Start from a template</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q.label}
                onClick={() => applyTemplate(q)}
                className="text-[11px] bg-brand-50 text-brand-700 border border-brand-100 rounded-full px-3 py-1 font-medium active:scale-95 transition-transform"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <p className="text-xs font-semibold text-ink mb-1.5">Title <span className="font-normal text-slate-400">(optional)</span></p>
          <input
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Office closed on Friday"
            className="input text-sm"
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-end justify-between mb-1.5">
            <p className="text-xs font-semibold text-ink">Message</p>
            <p className={`text-[10px] ${nearLimit ? 'text-rust font-semibold' : 'text-slate-400'}`}>
              {words} words · {lines} lines · {message.length.toLocaleString('en-IN')} / {MAX_CHARS.toLocaleString('en-IN')}
            </p>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
            rows={9}
            placeholder={`Type your ${selectedType?.label.toLowerCase()} message here. Write as many lines as you need — press Enter for a new line.`}
            className="input resize-y min-h-[10rem] leading-relaxed"
          />
          <details className="mt-2 rounded-xl bg-surface border border-brand-100 px-3 py-2 text-[11px] text-slate-500">
            <summary className="cursor-pointer font-semibold text-brand-700">How to format your message</summary>
            <ul className="mt-2 space-y-1 leading-relaxed">
              <li>Leave an empty line to start a new paragraph.</li>
              <li>Start a line with <b>-</b> for a bullet point.</li>
              <li>Start a line with <b>1.</b> <b>2.</b> for a numbered list.</li>
              <li>Start a line with <b>#</b> for a small heading.</li>
              <li>Put <b>**two stars**</b> around words to make them bold.</li>
            </ul>
          </details>
        </div>

        {/* Live preview — the same card people will see */}
        {(message.trim() || title.trim()) && (
          <div>
            <p className="text-xs font-semibold text-ink mb-2">Preview</p>
            <AnnouncementCard
              preview
              data={{ title, message: message || ' ', type, authorName: hrName || 'HR', postedAt: new Date().toISOString() }}
            />
          </div>
        )}

        <button onClick={handlePost} disabled={posting || !message.trim()} className="w-full btn-primary py-3 text-sm">
          {posting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" /></svg>
              {progress ? `Publishing part ${progress.done} of ${progress.total}…` : 'Publishing…'}
            </span>
          ) : `${selectedType?.icon} Publish to Home Page`}
        </button>
        {progress && (
          <div className="h-1.5 rounded-full bg-brand-50 overflow-hidden -mt-2">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-gold-400 transition-all duration-300" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}
