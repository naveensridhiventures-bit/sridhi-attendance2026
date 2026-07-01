import React, { useEffect, useState } from 'react'
import { getLogs } from '../api/sheetApi.js'

const STATUS_STYLE = {
  P:   { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Present' },
  A:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Absent' },
  WO:  { bg: 'bg-yellow-100', text: 'text-yellow-700',  label: 'Week Off' },
  WOP: { bg: 'bg-purple-100', text: 'text-purple-700',  label: 'Worked on WO' },
  NA:  { bg: 'bg-blue-100',   text: 'text-blue-700',    label: 'Not Available' }
}

export default function LogsView() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await getLogs(200)
      setLogs(res.logs || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase()
    return !q || l.name?.toLowerCase().includes(q) || l.employeeId?.toLowerCase().includes(q) || l.role?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-3">
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card">
        <p className="font-display font-semibold text-ink text-sm mb-3">Attendance Logs</p>
        <input
          type="text"
          placeholder="Search by name, ID, or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((l, idx) => {
          const style = STATUS_STYLE[l.status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: l.status }
          const hasLoc = l.latitude && l.longitude
          const mapUrl = hasLoc ? `https://maps.google.com/?q=${l.latitude},${l.longitude}` : null
          return (
            <div key={idx} className="bg-white border border-brand-50 rounded-2xl p-3.5 shadow-card">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-ink truncate">{l.name}</p>
                  <p className="text-[11px] text-slate-400">{l.employeeId} · {l.role || '—'}</p>
                </div>
                <span className={`text-[10px] font-semibold rounded-full px-2 py-1 shrink-0 ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                <span>{l.date} · {l.time}</span>
                <span>Marked by: {l.markedBy || 'Self'}</span>
              </div>
              {hasLoc && (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[11px] font-semibold text-brand-600">
                  📍 View location on map
                </a>
              )}
            </div>
          )
        })}
        {!loading && filtered.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">No log entries yet.</p>
        )}
      </div>
    </div>
  )
}
