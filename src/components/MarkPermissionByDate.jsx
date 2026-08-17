import React, { useEffect, useMemo, useState } from 'react'
import { applyLeave, updatePermissionStatus, getPermissionsForMonth } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'
import { haptics } from '../utils/haptics.js'

const REASONS = ['Personal Work', 'Medical / Health', 'Family Emergency', 'Bank / Govt Work', 'Vehicle Issue', 'Other']
const HOURS = ['30m', '1 HR', '2 HRS', '3 HRS', '4 HRS']

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function ymOf(dateStr) {
  const parts = String(dateStr).split('-')
  return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) }
}

// HR-only tool: pick ANY date (past or future) and one or more workers,
// then mark permission for all of them in one go — same idea as
// "Edit Attendance by date", but for Permission entries. The single-
// employee "Mark Permission" form on the Attendance page still exists
// for one-off entries; this is for backfilling or applying a permission
// to a whole group at once. Entries marked here are auto-approved,
// since HR is recording them directly rather than an employee requesting.
export default function MarkPermissionByDate({ employees }) {
  const showToast = useToast()
  const [date, setDate] = useState(todayISO())
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [reason, setReason] = useState(REASONS[0])
  const [hours, setHours] = useState(HOURS[1])
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState(null)
  const [existing, setExisting] = useState({}) // { employeeId: true } already marked for this date
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [hideMarked, setHideMarked] = useState(false)

  // Whenever the date changes, load who already has a permission entry
  // for that day, same idea as EditAttendanceByDate's "already marked" check.
  useEffect(() => {
    if (!date) { setExisting({}); return }
    let cancelled = false
    setLoadingExisting(true)
    const { year, month } = ymOf(date)
    getPermissionsForMonth(year, month)
      .then((res) => {
        if (cancelled) return
        const map = {}
        ;(res.requests || []).forEach((r) => { if (r.date === date) map[r.employeeId] = true })
        setExisting(map)
      })
      .catch(() => { if (!cancelled) setExisting({}) })
      .finally(() => { if (!cancelled) setLoadingExisting(false) })
    return () => { cancelled = true }
  }, [date])

  const filtered = useMemo(() => {
    let list = employees
    if (hideMarked) list = list.filter((e) => !existing[e.employeeId])
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q))
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [employees, query, hideMarked, existing])

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

    const { year, month } = ymOf(date)
    const okNames = []
    const failed = []

    for (const id of ids) {
      const emp = employees.find((e) => e.employeeId === id)
      try {
        const res = await applyLeave({
          employeeId: id,
          name: emp?.name || '',
          type: 'permission',
          fromDate: date,
          toDate: '',
          reason: `${reason} - ${hours}`
        })
        // HR is marking this directly (not an employee request pending
        // review), so auto-approve it right away — mirrors how
        // Edit-Attendance-by-date sets a final status immediately.
        if (res?.requestId) {
          try {
            await updatePermissionStatus(res.requestId, year, month, 'approved')
          } catch (e) {
            // Entry was still created even if the auto-approve call failed;
            // HR can approve it manually from the History tab.
          }
        }
        okNames.push(emp?.name || id)
      } catch (e) {
        failed.push({ name: emp?.name || id, message: e.message })
      }
    }

    setSubmitting(false)
    setResults({ okNames, failed })
    setExisting((prev) => {
      const next = { ...prev }
      ids.forEach((id) => {
        const emp = employees.find((e) => e.employeeId === id)
        if (okNames.includes(emp?.name)) next[id] = true
      })
      return next
    })
    setSelected(new Set())

    if (okNames.length) {
      haptics.success()
      showToast(`Permission marked for ${okNames.length} worker${okNames.length > 1 ? 's' : ''} on ${date}`, 'success')
    }
    if (failed.length) {
      haptics.error()
      showToast(`${failed.length} entr${failed.length > 1 ? 'ies' : 'y'} failed — see details below`, 'error')
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-brand-50 shadow-card animate-popIn space-y-4">
      <div className="flex items-center gap-2 text-amber-600">
        <span className="text-lg">⏱</span>
        <p className="font-display font-semibold text-sm">Mark Permission for a Date</p>
      </div>
      <p className="text-xs text-slate-400 -mt-2">
        Apply a permission entry to one or many workers at once, for any past or future date — entries are auto-approved since you're recording them directly.
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
        {date && date !== todayISO() && (
          <p className="text-[10px] text-gold-600 mt-1">
            {date < todayISO() ? '📅 Backfilling a missed permission' : '📅 Marking a future permission'} for {date}
          </p>
        )}
      </div>

      {/* 2. Reason */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Reason</label>
        <div className="grid grid-cols-2 gap-1.5">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                reason === r ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-slate-500 border-brand-100'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Hours */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">No. of Hours</label>
        <div className="grid grid-cols-5 gap-1.5">
          {HOURS.map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                hours === h ? 'bg-gold-500 text-white border-gold-500' : 'bg-surface text-slate-500 border-brand-100'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Worker picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wide">
            Select Workers {selected.size > 0 && <span className="text-brand-600">({selected.size} selected)</span>}
          </label>
          <button onClick={() => setHideMarked((v) => !v)} className="text-[10px] font-semibold text-brand-600">
            {hideMarked ? 'Show all' : 'Hide already marked'}
          </button>
        </div>
        {loadingExisting && <p className="text-[10px] text-slate-400 mb-1.5">Loading what's already marked for {date}…</p>}

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
              {hideMarked ? 'Everyone already has a permission entry for this date 🎉' : 'No matching worker'}
            </p>
          )}
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
                {existing[e.employeeId] && (
                  <span className="shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 border bg-gold-50 text-gold-700 border-gold-200">
                    Already marked
                  </span>
                )}
              </label>
            )
          })}
        </div>
      </div>

      {/* 5. Submit */}
      <button
        onClick={submit}
        disabled={submitting || selected.size === 0 || !date}
        className="w-full btn-primary py-3.5"
      >
        {submitting ? (
          <span>Marking {selected.size} worker{selected.size === 1 ? '' : 's'}…</span>
        ) : (
          <span>⏱ Mark permission for {selected.size || ''} worker{selected.size === 1 ? '' : 's'} on {date || '…'}</span>
        )}
      </button>

      {submitting && (
        <div className="w-full h-1.5 rounded-full bg-brand-50 overflow-hidden">
          <div className="h-full w-1/3 bg-brand-500 animate-pulse rounded-full" />
        </div>
      )}

      {/* 6. Results summary */}
      {results && (
        <div className="rounded-2xl border border-brand-100 p-3 space-y-2 animate-popIn">
          {results.okNames.length > 0 && (
            <p className="text-xs text-brand-700">✓ Marked: {results.okNames.join(', ')}</p>
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
