import React, { useMemo, useState } from 'react'
import { markAttendanceForDate } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'
import { STATUS_OPTIONS, getStatusMeta } from '../utils/attendanceStatus.js'
import { haptics } from '../utils/haptics.js'

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// HR-only tool: pick ANY date (past or future) and one or more workers,
// then set their status for that specific day. This is separate from the
// regular Mark/Bulk flow on the Attendance page, which always applies to
// today only — this is for corrections and backfilling.
export default function EditAttendanceByDate({ employees }) {
  const showToast = useToast()
  const [date, setDate] = useState(todayISO())
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [status, setStatus] = useState('present')
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = employees
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q))
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [employees, query])

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

  async function submit() {
    if (!date) {
      showToast('Pick a date first.', 'error')
      return
    }
    if (selected.size === 0) {
      showToast('Select at least one worker first.', 'error')
      return
    }
    const ids = Array.from(selected)
    setSubmitting(true)
    setResults(null)

    let okNames = []
    let failed = []

    try {
      const entries = ids.map((id) => ({ employeeId: id, status }))
      const res = await markAttendanceForDate({ date, entries, markedBy: 'HR Admin' })
      okNames = res.marked || []
      failed = (res.failed || []).map((f) => ({
        name: employees.find((e) => e.employeeId === f.employeeId)?.name || f.employeeId,
        message: f.message
      }))
    } catch (e) {
      failed = ids.map((id) => ({ name: employees.find((ee) => ee.employeeId === id)?.name || id, message: e.message }))
    }

    setSubmitting(false)
    setResults({ okNames, failed })
    setSelected(new Set())

    if (okNames.length) {
      haptics.success()
      showToast(`${okNames.length} worker${okNames.length > 1 ? 's' : ''} set to ${getStatusMeta(status).full} for ${date}`, 'success')
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
        <span className="text-lg">🗓️</span>
        <p className="font-display font-semibold text-sm">Edit Attendance for a Date</p>
      </div>
      <p className="text-xs text-slate-400 -mt-2">
        Correct or backfill attendance for any past or future date — the linked month's Attendance sheet and Salary numbers update automatically.
      </p>

      {/* 1. Date */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input text-sm"
        />
      </div>

      {/* 2. Status to apply */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Set status to</label>
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

      {/* 3. Worker picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wide">
            Select Workers {selected.size > 0 && <span className="text-brand-600">({selected.size} selected)</span>}
          </label>
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
          {filtered.length === 0 && <p className="text-center text-xs text-slate-400 py-6">No matching worker</p>}
          {filtered.map((e) => {
            const isSel = selected.has(e.employeeId)
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
                <span className="text-sm font-medium text-ink truncate flex-1">{e.name}</span>
                <span className="shrink-0 text-[10px] text-slate-400">{e.employeeId}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* 4. Submit */}
      <button
        onClick={submit}
        disabled={submitting || selected.size === 0 || !date}
        className="w-full btn-primary py-3.5"
      >
        {submitting ? (
          <span>Updating {selected.size} worker{selected.size === 1 ? '' : 's'}…</span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
            Set {selected.size || ''} worker{selected.size === 1 ? '' : 's'} to {meta.full} on {date || '…'}
          </span>
        )}
      </button>

      {submitting && (
        <div className="w-full h-1.5 rounded-full bg-brand-50 overflow-hidden">
          <div className="h-full w-1/3 bg-brand-500 animate-pulse rounded-full" />
        </div>
      )}

      {/* 5. Results summary */}
      {results && (
        <div className="rounded-2xl border border-brand-100 p-3 space-y-2 animate-popIn">
          {results.okNames.length > 0 && (
            <p className="text-xs text-brand-700">✓ Updated: {results.okNames.join(', ')}</p>
          )}
          {results.failed.length > 0 && (
            <div className="text-xs text-rust">
              <p className="font-semibold mb-1">✕ Failed ({results.failed.length}):</p>
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
