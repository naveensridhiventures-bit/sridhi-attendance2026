import React, { useEffect, useMemo, useState } from 'react'
import { addDriverKm, deleteDriverKmEntry, getDriverKmLogs, getDriverKmSummary } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'
import EmployeePicker from './EmployeePicker.jsx'
import { downloadExcel, downloadPdf } from '../utils/reportExport.js'

function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export default function DriverKmManager({ employees, hrName }) {
  const showToast = useToast()
  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDriver, setFilterDriver] = useState('')

  const [employeeId, setEmployeeId] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [date, setDate] = useState(todayStr())
  const [startKm, setStartKm] = useState('')
  const [endKm, setEndKm] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadAll() }, [])
  useEffect(() => { loadLogs() }, [filterDriver])

  async function loadAll() {
    setLoading(true)
    try {
      const [logRes, sumRes] = await Promise.all([getDriverKmLogs(filterDriver || undefined), getDriverKmSummary()])
      setLogs(logRes.entries || [])
      setSummary(sumRes.summary || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadLogs() {
    try {
      const res = await getDriverKmLogs(filterDriver || undefined)
      setLogs(res.entries || [])
    } catch (e) {
      console.error(e)
    }
  }

  const previousVehicles = useMemo(() => {
    const set = new Set()
    logs.forEach((l) => l.vehicle && set.add(l.vehicle))
    return Array.from(set)
  }, [logs])

  const tripKm = useMemo(() => {
    const s = parseFloat(startKm), e = parseFloat(endKm)
    if (isNaN(s) || isNaN(e) || e < s) return null
    return Math.round((e - s) * 100) / 100
  }, [startKm, endKm])

  async function submit() {
    if (!employeeId) { showToast('Choose a driver first.', 'error'); return }
    const s = parseFloat(startKm), e = parseFloat(endKm)
    if (isNaN(s) || isNaN(e)) { showToast('Enter both Start KM and End KM.', 'error'); return }
    if (e < s) { showToast('End KM cannot be less than Start KM.', 'error'); return }
    const emp = employees.find((x) => x.employeeId === employeeId)
    setSubmitting(true)
    try {
      await addDriverKm({
        employeeId, name: emp?.name || '', vehicle, date,
        startKm: s, endKm: e, notes, addedBy: hrName || 'HR'
      })
      showToast(`${tripKm} km logged for ${emp?.name}`, 'success')
      setStartKm('')
      setEndKm('')
      setNotes('')
      loadAll()
    } catch (e2) {
      showToast('Failed: ' + e2.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(entryId) {
    try {
      await deleteDriverKmEntry(entryId)
      setLogs((list) => list.filter((l) => l.entryId !== entryId))
      loadAll()
      showToast('Entry removed', 'info')
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    }
  }

  function downloadExcelReport() {
    downloadExcel(
      'Driver-KM-Report',
      'Driver KM Report — Date-wise',
      ['Date', 'Driver', 'Vehicle', 'Start KM', 'End KM', 'Trip KM', 'Notes'],
      logs.map((l) => [l.date, l.name, l.vehicle || '—', l.startKm, l.endKm, l.tripKm, l.notes || ''])
    )
  }

  function downloadPdfReport() {
    const overallKm = summary.reduce((s, d) => s + d.totalKm, 0)
    downloadPdf(
      'Driver KM Report',
      `Sridhi Ventures · Lease Vehicle Trip Log · Generated ${new Date().toLocaleDateString('en-IN')}`,
      ['Date', 'Driver', 'Vehicle', 'Start KM', 'End KM', 'Trip KM'],
      logs.map((l) => [l.date, l.name, l.vehicle || '—', l.startKm, l.endKm, l.tripKm]),
      [
        { label: 'Overall KM (all drivers)', value: overallKm.toLocaleString('en-IN') + ' km' },
        { label: 'Total Trips', value: String(logs.length) },
        { label: 'Drivers', value: String(summary.length) }
      ]
    )
  }

  return (
    <div className="space-y-4">
      {/* Log a trip */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card space-y-3">
        <p className="font-display font-semibold text-ink text-sm">Log Driver KM</p>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Driver</label>
          <EmployeePicker employees={employees} marked={{}} value={employeeId} onChange={setEmployeeId} placeholder="Choose driver…" />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Lease Vehicle</label>
          <input
            type="text"
            list="vehicle-suggestions"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            placeholder="e.g. TN 09 AB 1234"
            className="input"
          />
          <datalist id="vehicle-suggestions">
            {previousVehicles.map((v) => <option key={v} value={v} />)}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Start KM</label>
            <input type="number" min="0" value={startKm} onChange={(e) => setStartKm(e.target.value)} placeholder="0" className="input" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">End KM</label>
          <input type="number" min="0" value={endKm} onChange={(e) => setEndKm(e.target.value)} placeholder="0" className="input" />
        </div>

        {tripKm !== null && (
          <div className="rounded-xl bg-brand-50 border border-brand-200 px-3 py-2 text-center">
            <span className="text-brand-700 text-sm font-bold">{tripKm} km</span>
            <span className="text-brand-600 text-xs"> this trip</span>
          </div>
        )}

        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional) — e.g. route or purpose"
          className="input text-sm"
        />

        <button onClick={submit} disabled={submitting} className="w-full btn-primary py-3 text-sm">
          {submitting ? 'Saving…' : '+ Log Trip'}
        </button>
      </div>

      {/* Per-driver summary */}
      {summary.length > 0 && (
        <div className="space-y-2">
          <p className="font-display font-semibold text-ink text-sm px-1">Overall KM by Driver</p>
          {summary.map((d) => (
            <div key={d.employeeId || d.name} className="bg-white border border-brand-50 rounded-2xl p-3.5 shadow-card flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-medium text-sm text-ink truncate">{d.name}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {d.trips} trips · {d.vehicles.join(', ') || 'no vehicle noted'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display font-bold text-brand-600 text-base">{d.totalKm.toLocaleString('en-IN')} km</p>
                <p className="text-[10px] text-slate-400">last: {d.lastDate || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter + download */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card space-y-3">
        <p className="font-display font-semibold text-ink text-sm">Trip Log</p>
        <EmployeePicker
          employees={[{ employeeId: '', name: 'All drivers' }, ...employees]}
          marked={{}}
          value={filterDriver}
          onChange={setFilterDriver}
          placeholder="Filter by driver…"
        />
        {logs.length > 0 && (
          <div className="flex gap-2">
            <button onClick={downloadPdfReport} className="flex-1 text-xs font-semibold py-2.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200">
              ⬇ PDF Report
            </button>
            <button onClick={downloadExcelReport} className="flex-1 text-xs font-semibold py-2.5 rounded-xl bg-surface text-slate-600 border border-brand-100">
              ⬇ Excel Report
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {loading && [1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}
        {!loading && logs.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">No trips logged yet.</p>
        )}
        {logs.map((l) => (
          <div key={l.entryId} className="bg-white border border-brand-50 rounded-2xl p-3 shadow-card flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm text-ink truncate">{l.name} <span className="text-slate-400 font-normal">· {l.vehicle || 'no vehicle'}</span></p>
              <p className="text-[11px] text-slate-400">{l.date} · {l.startKm} → {l.endKm} km{l.notes ? ' · ' + l.notes : ''}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <p className="font-display font-bold text-brand-600 text-sm">{l.tripKm} km</p>
              <button onClick={() => remove(l.entryId)} className="text-slate-300 hover:text-rust text-lg leading-none px-1">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
