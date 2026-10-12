import React, { useEffect, useState } from 'react'
import { getTodaySummary, sendReportNow } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'
import CountUp from './CountUp.jsx'
import TiltCard from './TiltCard.jsx'

const R = 38
const C = 2 * Math.PI * R

// Live roll-call card at the top of the HR dashboard: an animated attendance ring,
// today's counts, and a button that emails the 5 PM-style report to management right now.
export default function HRLiveStrip() {
  const showToast = useToast()
  const [s, setS] = useState(null)
  const [failed, setFailed] = useState(false)
  const [grow, setGrow] = useState(false)
  const [send, setSend] = useState('idle') // idle | sending | sent

  useEffect(() => {
    let alive = true
    const load = () =>
      getTodaySummary()
        .then((d) => { if (alive) { setS(d); setFailed(false) } })
        .catch(() => { if (alive) setFailed(true) })
    load()
    const t = setInterval(load, 60000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  useEffect(() => {
    if (!s) return
    const raf = requestAnimationFrame(() => setGrow(true))
    return () => cancelAnimationFrame(raf)
  }, [s])

  const total = s ? (s.officeTotal || 0) + (s.productionTotal || 0) : 0
  const present = s ? (s.officePresent || 0) + (s.productionPresent || 0) : 0
  const absent = s ? (s.officeAbsent || 0) + (s.productionAbsent || 0) : 0
  const notMarked = Math.max(total - present - absent, 0)
  const pct = total ? Math.round((present / total) * 100) : 0

  async function sendNow() {
    if (send === 'sending') return
    setSend('sending')
    try {
      const r = await sendReportNow()
      setSend('sent')
      showToast(r?.message || 'Report sent to management', 'success')
      setTimeout(() => setSend('idle'), 3800)
    } catch (e) {
      setSend('idle')
      showToast(e.message || 'Could not send the report', 'error')
    }
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <div className="mb-5 rise" style={{ '--i': 1 }}>
      <TiltCard maxTilt={4} className="rounded-3xl">
        <div className="spin-border rounded-3xl p-4 text-white shadow-soft" style={{ '--spin-fill': '#0C5128' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full bg-gold-400 animate-ping opacity-75" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-gold-400" />
              </span>
              <span className="text-[11px] font-semibold text-brand-100">Live roll call</span>
            </div>
            <span className="text-[11px] text-brand-200">{today}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
              <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                <circle cx="48" cy="48" r={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="9" />
                <circle
                  cx="48" cy="48" r={R} fill="none" stroke="#F2B544" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={grow ? C * (1 - pct / 100) : C}
                  style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-bold text-2xl leading-none">
                  <CountUp value={pct} />
                  <span className="text-sm">%</span>
                </span>
                <span className="text-[9px] text-brand-200 mt-1">present</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-2">
              <Mini label="Present" value={present} tone="bg-white/15" i={2} />
              <Mini label="Absent" value={absent} tone="bg-rust/70" i={3} />
              <Mini label="Not marked" value={notMarked} tone="bg-gold-500/40" i={4} />
            </div>
          </div>

          {failed && !s && <p className="text-[11px] text-brand-100 mt-3">Could not load today's numbers. Pull down to retry.</p>}
          {!s && !failed && <div className="h-3 rounded-full skeleton mt-3 opacity-40" />}

          <button
            onClick={sendNow}
            disabled={send === 'sending'}
            className={`mt-4 w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold transition-all duration-300 ${
              send === 'sent' ? 'bg-brand-400 text-ink' : 'bg-white text-brand-700 active:scale-[0.98]'
            }`}
          >
            {send === 'sent' ? (
              <>
                <span className="pop-check inline-flex">✓</span> Sent to management
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className={send === 'sending' ? 'mail-fly' : ''}>
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {send === 'sending' ? 'Sending report…' : 'Send attendance report now'}
              </>
            )}
          </button>
        </div>
      </TiltCard>
    </div>
  )
}

function Mini({ label, value, tone, i }) {
  return (
    <div className={`rise rounded-2xl px-2 py-2.5 text-center ${tone}`} style={{ '--i': i }}>
      <p className="font-display font-bold text-xl leading-none">
        <CountUp value={value} />
      </p>
      <p className="text-[9px] text-brand-100 mt-1.5 leading-tight">{label}</p>
    </div>
  )
}
