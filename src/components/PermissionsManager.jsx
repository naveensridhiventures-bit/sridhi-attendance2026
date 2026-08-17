import React, { useEffect, useMemo, useState } from 'react'
import { getPermissionsForMonth, updatePermissionStatus, deletePermissionEntry } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const STATUS_STYLE = {
  pending:  'bg-gold-50 text-gold-700 border-gold-200',
  approved: 'bg-brand-50 text-brand-700 border-brand-200',
  rejected: 'bg-rust/10 text-rust border-rust/30'
}

// HR-only view of every Permission entry ever submitted — same idea as
// "Edit Attendance by date", but for Permission requests, which previously
// had no read-back anywhere in the app once submitted.
export default function PermissionsManager() {
  const showToast = useToast()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { load() }, [year, month])

  async function load() {
    setLoading(true)
    try {
      const res = await getPermissionsForMonth(year, month)
      setRequests(res.requests || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function act(r, status) {
    try {
      await updatePermissionStatus(r.requestId, year, month, status)
      setRequests((list) => list.map((x) => x.requestId === r.requestId ? { ...x, status } : x))
      showToast(`${r.name}'s permission ${status}`, status === 'approved' ? 'success' : 'info')
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    }
  }

  async function remove(r) {
    try {
      await deletePermissionEntry(r.requestId, year, month)
      setRequests((list) => list.filter((x) => x.requestId !== r.requestId))
      showToast('Entry removed', 'info')
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    }
  }

  const filtered = useMemo(() => {
    let list = requests
    if (statusFilter !== 'all') list = list.filter((r) => (r.status || 'pending').toLowerCase() === statusFilter)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q))
    return list
  }, [requests, query, statusFilter])

  const label = MONTHS[month - 1] + '-' + year

  return (
    <div className="space-y-4">
      {/* Month navigator */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => { if (month === 1) { setMonth(12); setYear((y) => y - 1) } else setMonth((m) => m - 1) }} className="w-8 h-8 rounded-lg bg-surface text-brand-600 font-bold">‹</button>
          <div className="text-center">
            <p className="font-display font-semibold text-ink text-sm">Permissions · {label}</p>
            <p className="text-[11px] text-slate-400">{requests.length} total entries</p>
          </div>
          <button onClick={() => { if (month === 12) { setMonth(1); setYear((y) => y + 1) } else setMonth((m) => m + 1) }} className="w-8 h-8 rounded-lg bg-surface text-brand-600 font-bold">›</button>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name…"
          className="input text-sm mb-2"
        />

        <div className="flex gap-1.5">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 text-[10.5px] font-semibold py-1.5 rounded-lg capitalize border transition-colors ${
                statusFilter === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-slate-500 border-brand-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading && [1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}
        {!loading && filtered.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">No permission entries for {label}{statusFilter !== 'all' ? ` (${statusFilter})` : ''}.</p>
        )}
        {filtered.map((r) => {
          const status = (r.status || 'pending').toLowerCase()
          return (
            <div key={r.requestId} className="bg-white border border-brand-50 rounded-2xl p-3.5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-ink truncate">
                    {r.name} <span className="text-slate-400 font-normal">({r.employeeId})</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.date}{r.hours ? ` · ${r.hours} hrs` : ''}</p>
                  {r.reason && <p className="text-xs text-slate-400 mt-1">"{r.reason}"</p>}
                </div>
                <span className={`shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 border capitalize ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}>
                  {status}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                {status !== 'approved' && (
                  <button onClick={() => act(r, 'approved')} className="flex-1 bg-brand-500 text-white text-xs font-semibold rounded-lg py-2">
                    Approve
                  </button>
                )}
                {status !== 'rejected' && (
                  <button onClick={() => act(r, 'rejected')} className="flex-1 bg-rust text-white text-xs font-semibold rounded-lg py-2">
                    Reject
                  </button>
                )}
                <button onClick={() => remove(r)} className="px-3 bg-surface text-slate-500 text-xs font-semibold rounded-lg py-2 border border-brand-100">
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
