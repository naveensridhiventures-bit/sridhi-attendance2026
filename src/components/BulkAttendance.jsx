import React, { useMemo, useState } from 'react'
import { markAttendance } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'
import { STATUS_OPTIONS, getStatusMeta } from '../utils/attendanceStatus.js'
import { haptics } from '../utils/haptics.js'

// Lets a supervisor tick many workers at once, pick ONE status, and submit
// all of them in a single go — instead of repeating the single-employee
// flow one name at a time. Submissions are sent one-by-one in the
// background (not in parallel) so the Google Sheet never gets two writes
// racing each other, which is what used to cause silent errors.
export default function BulkAttendance({ employees, marked, setMarked, location, locStatus, captureLocation, onDone }) {
  const showToast = useToast()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [status, setStatus] = useState('present')
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [results, setResults] = useState(null) // { okNames: [], failed: [{name, message}] }
  const [hideMarked, setHideMarked] = useState(true)

  const filtered = useMemo(() => {
    let list = employees
    if (hideMarked) list = list.filter((e) => !marked[e.employeeId])
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q))
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [employees, query, hideMarked, marked])

  function toggle(id) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllVisible() {
    setSelected((s) => {
      const next = new Set(s)
      filtered.forEach((e) => next.add(e.employeeId))
      return next
    })
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function submitBulk() {
    if (selected.size === 0) {
      showToast('Select at least one worker first.', 'error')
      return
    }
    if (!status) {
      showToast('Choose a status to apply.', 'error')
      return
    }
    const ids = Array.from(selected)
    setSubmitting(true)
    setResults(null)
    setProgress({ done: 0, total: ids.length })

    const okNames = []
    const failed = []

    // Sequential on purpose — avoids concurrent writes to the same
    // Google Sheet row/column which is what caused stray errors before.
    for (const id of ids) {
      const emp = employees.find((e) => e.employeeId === id)
      try {
        await markAttendance({ employeeId: id, status, mode: 'manual', location })
        okNames.push(emp?.name || id)
        setMarked((m) => ({ ...m, [id]: status }))
      } catch (e) {
        failed.push({ name: emp?.name || id, message: e.message })
      } finally {
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      }
    }

    setSubmitting(false)
    setResults({ okNames, failed })
    setSelected(new Set())

    if (okNames.length) {
      haptics.success()
      showToast(`${okNames.length} worker${okNames.length > 1 ? 's' : ''} marked ${getStatusMeta(status).full}`, 'success')
      onDone?.()
    }
    if (failed.length) {
      haptics.error()
      showToast(`${failed.length} entr${failed.length > 1 ? 'ies' : 'y'} failed — see details below`, 'error')
    }
  }

  const meta = getStatusMeta(status)

  return (
    <div className="bg-white rounded-3xl p-5 border border-brand-50 shadow-card animate-popIn space-y-4">
      <div className="flex items-center gap-2 text-brand-600">
        <span className="text-lg">👥</span>
        <p className="font-display font-semibold text-sm">Bulk Mark Attendance</p>
      </div>
      <p className="text-xs text-slate-400 -mt-2">Tick every worker, choose one status, submit once — no need to repeat the form per person.</p>

      {/* 1. Status to apply */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Apply this status</label>
        <div className="grid grid-cols-5 gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStatus(opt.key)}
              title={opt.full}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${
                status === opt.key
                  ? `bg-gradient-to-br ${opt.color} text-white border-transparent shadow-soft scale-105`
                  : 'bg-surface text-slate-500 border-brand-100'
              }`}
            >
              <span className="text-xs">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Location (shared, captured once for the whole batch) */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Location</label>
        <button
          onClick={captureLocation}
          className={`w-full flex items-center gap-2.5 rounded-xl px-4 py-3 border text-sm font-medium transition-colors ${
            locStatus === 'done' ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-surface border-brand-100 text-slate-500'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
            <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          {locStatus === 'done' && location
            ? `Location captured (${location.lat}, ${location.lng})`
            : locStatus === 'locating'
            ? 'Capturing location…'
            : 'Capture My Location'}
        </button>
      </div>

      {/* 3. Worker picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wide">
            Select Workers {selected.size > 0 && <span className="text-brand-600">({selected.size} selected)</span>}
          </label>
          <button onClick={() => setHideMarked((v) => !v)} className="text-[10px] font-semibold text-brand-600">
            {hideMarked ? 'Show all' : 'Hide marked'}
          </button>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name…"
          className="input text-sm mb-2"
        />

        <div className="flex gap-2 mb-2">
          <button onClick={selectAllVisible} className="flex-1 text-[11px] font-semibold py-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-200">
            Select all shown ({filtered.length})
          </button>
          <button onClick={clearSelection} className="flex-1 text-[11px] font-semibold py-2 rounded-xl bg-surface text-slate-500 border border-brand-100">
            Clear selection
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-2xl border border-brand-50 divide-y divide-brand-50">
          {filtered.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-6">
              {hideMarked ? 'Everyone is already marked 🎉' : 'No matching worker'}
            </p>
          )}
          {filtered.map((e) => {
            const isSel = selected.has(e.employeeId)
            const existing = getStatusMeta(marked[e.employeeId])
            return (
              <label
                key={e.employeeId}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isSel ? 'bg-brand-50' : 'bg-white'}`}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggle(e.employeeId)}
                  className="w-4 h-4 accent-brand-500 shrink-0"
                />
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${existing.dot}`} />
                <span className="text-sm font-medium text-ink truncate flex-1">{e.name}</span>
                {marked[e.employeeId] && (
                  <span className={`shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 border ${existing.soft}`}>{existing.full}</span>
                )}
              </label>
            )
          })}
        </div>
      </div>

      {/* 4. Submit */}
      <button
        onClick={submitBulk}
        disabled={submitting || selected.size === 0}
        className="w-full btn-primary py-3.5"
      >
        {submitting ? (
          <span>Marking {progress.done}/{progress.total}…</span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
            Mark {selected.size || ''} worker{selected.size === 1 ? '' : 's'} as {meta.full}
          </span>
        )}
      </button>

      {submitting && (
        <div className="w-full h-1.5 rounded-full bg-brand-50 overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all duration-200"
            style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* 5. Results summary */}
      {results && (
        <div className="rounded-2xl border border-brand-100 p-3 space-y-2 animate-popIn">
          {results.okNames.length > 0 && (
            <p className="text-xs text-brand-700">
              ✓ Marked: {results.okNames.join(', ')}
            </p>
          )}
          {results.failed.length > 0 && (
            <div className="text-xs text-rust">
              <p className="font-semibold mb-1">✕ Failed ({results.failed.length}) — tap to retry individually from the Mark tab:</p>
              <ul className="space-y-0.5">
                {results.failed.map((f, i) => (
                  <li key={i}>{f.name}: {f.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
