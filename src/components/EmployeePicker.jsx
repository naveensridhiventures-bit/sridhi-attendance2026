import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getStatusMeta } from '../utils/attendanceStatus.js'

// A searchable dropdown that shows a colour dot for each employee's
// today-status (green = present, red = absent, gold = week off, etc.)
// and a "Just marked" pill for anyone marked in the last few minutes.
// Replaces the plain <select> so supervisors can see status at a glance.
export default function EmployeePicker({
  employees,
  marked,
  value,
  onChange,
  placeholder = 'Choose a name…',
  recentIds = []
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
    else setQuery('')
  }, [open])

  const selected = employees.find((e) => e.employeeId === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? employees.filter((e) => e.name.toLowerCase().includes(q)) : employees
    // Unmarked first (what supervisors usually need), then marked, alphabetical within each group
    return [...list].sort((a, b) => {
      const am = marked[a.employeeId] ? 1 : 0
      const bm = marked[b.employeeId] ? 1 : 0
      if (am !== bm) return am - bm
      return a.name.localeCompare(b.name)
    })
  }, [employees, query, marked])

  function pick(emp) {
    onChange(emp.employeeId)
    setOpen(false)
  }

  const selectedMeta = getStatusMeta(marked[selected?.employeeId])

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedMeta.dot}`} />
              <span className="truncate">{selected.name}</span>
              {marked[selected.employeeId] && (
                <span className="text-[10px] text-slate-400 shrink-0">· {getStatusMeta(marked[selected.employeeId]).full}</span>
              )}
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border border-brand-100 rounded-2xl shadow-card overflow-hidden animate-popIn">
          <div className="p-2 border-b border-brand-50">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name…"
              className="input py-2 text-sm"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-4">No matching employee</p>
            )}
            {filtered.map((emp) => {
              const status = marked[emp.employeeId]
              const meta = getStatusMeta(status)
              const isJustMarked = recentIds.includes(emp.employeeId)
              return (
                <button
                  type="button"
                  key={emp.employeeId}
                  onClick={() => pick(emp)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-surface transition-colors ${
                    value === emp.employeeId ? 'bg-brand-50' : ''
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
                    <span className="truncate font-medium text-ink">{emp.name}</span>
                  </span>
                  {isJustMarked ? (
                    <span className="shrink-0 text-[10px] font-semibold bg-brand-500 text-white rounded-full px-2 py-0.5">✓ Just marked</span>
                  ) : status ? (
                    <span className={`shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 border ${meta.soft}`}>{meta.full}</span>
                  ) : (
                    <span className="shrink-0 text-[10px] text-slate-300">Not marked</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
