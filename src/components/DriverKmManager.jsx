import React, { useEffect, useMemo, useState } from 'react'
import { addDriverKm, deleteDriverKmEntry, getDriverKmLogs, getDriverKmSummary, updateDriverKmEntry } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'
import EmployeePicker from './EmployeePicker.jsx'
import { downloadExcel, downloadPdf } from '../utils/reportExport.js'

function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

// Remembers which vehicle each driver last used, in the browser's local
// storage — purely a convenience so HR doesn't have to retype the same
// vehicle number every time the same driver is picked. Not synced to the
// sheet; it's just a per-device autofill shortcut.
const VEHICLE_KEY_PREFIX = 'driverKm:lastVehicle:'
function rememberVehicle(employeeId, vehicle) {
  if (!employeeId || !vehicle) return
  try { localStorage.setItem(VEHICLE_KEY_PREFIX + employeeId, vehicle) } catch (_) {}
}
function recallVehicle(employeeId) {
  if (!employeeId) return ''
  try { return localStorage.getItem(VEHICLE_KEY_PREFIX + employeeId) || '' } catch (_) { return '' }
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
  const [editingId, setEditingId] = useState(null) // entryId currently being edited, or null when adding new

  // Only people whose Role/Designation mentions "driver" show up here —
  // keeps the picker short and on-target instead of listing the whole
  // workforce for a KM entry that's only ever logged for drivers.
  const drivers = useMemo(
    () => employees.filter((e) => (e.role || '').toLowerCase().includes('driver')),
    [employees]
  )

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

  // Whenever a different driver is picked, auto-fill the vehicle field
  // with whatever they were driving last time — only when adding a new
  // entry (editing an existing one keeps that entry's own saved vehicle).
  function onDriverChange(id) {
    setEmployeeId(id)
    if (!editingId) setVehicle(recallVehicle(id))
  }

  function resetForm() {
    setEditingId(null)
    setEmployeeId('')
    setVehicle('')
    setDate(todayStr())
    setStartKm('')
    setEndKm('')
    setNotes('')
  }

  function startEdit(l) {
    setEditingId(l.entryId)
    setEmployeeId(l.employeeId)
    setVehicle(l.vehicle || '')
    setDate(l.date)
    setStartKm(String(l.startKm))
    setEndKm(String(l.endKm))
    setNotes(l.notes || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    if (!employeeId) { showToast('Choose a driver first.', 'error'); return }
    const s = parseFloat(startKm), e = parseFloat(endKm)
    if (isNaN(s) || isNaN(e)) { showToast('Enter both Start KM and End KM.', 'error'); return }
    if (e < s) { showToast('End KM cannot be less than Start KM.', 'error'); return }
    const emp = employees.find((x) => x.employeeId === employeeId)
    setSubmitting(true)
    try {
      if (editingId) {
        await updateDriverKmEntry(editingId, {
          employeeId, name: emp?.name || '', vehicle, date, startKm: s, endKm: e, notes
        })
        showToast(`Trip updated — ${tripKm} km for ${emp?.name}`, 'success')
      } else {
        await addDriverKm({
          employeeId, name: emp?.name || '', vehicle, date,
          startKm: s, endKm: e, notes, addedBy: hrName || 'HR'
        })
        showToast(`${tripKm} km logged for ${emp?.name}`, 'success')
      }
      rememberVehicle(employeeId, vehicle)
      resetForm()
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
      if (editingId === entryId) resetForm()
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
      {/* Log / edit a trip */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-display font-semibold text-ink text-sm">{editingId ? 'Edit Trip' : 'Log Driver KM'}</p>
          {editingId && (
            <button onClick={resetForm} className="text-[11px] font-semibold text-slate-400">Cancel edit</button>
          )}
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Driver</label>
          {drivers.length === 0 ? (
            <p className="text-xs text-rust bg-rust/5 border border-rust/20 rounded-xl px-3 py-2.5">
              No employee has "Driver" set as their Role yet. Add it via HR → Add Employee → Role / Designation (must contain the word "Driver").
            </p>
          ) : (
            <EmployeePicker employees={drivers} marked={{}} value={employeeId} onChange={onDriverChange} placeholder="Choose driver…" />
          )}
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
          {employeeId && !editingId && recallVehicle(employeeId) && (
            <p className="text-[10px] text-brand-600 mt-1">↺ Auto-filled from this driver's last trip — edit if a different vehicle was used.</p>
          )}
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
          {submitting ? 'Saving…' : editingId ? '✓ Update Trip' : '+ Log Trip'}
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
          employees={[{ employeeId: '', name: 'All drivers' }, ...drivers]}
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
          <div key={l.entryId} className={`bg-white border rounded-2xl p-3 shadow-card flex items-center justify-between gap-2 ${editingId === l.entryId ? 'border-brand-300 ring-2 ring-brand-100' : 'border-brand-50'}`}>
            <div className="min-w-0">
              <p className="font-medium text-sm text-ink truncate">{l.name} <span className="text-slate-400 font-normal">· {l.vehicle || 'no vehicle'}</span></p>
              <p className="text-[11px] text-slate-400">{l.date} · {l.startKm} → {l.endKm} km{l.notes ? ' · ' + l.notes : ''}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <p className="font-display font-bold text-brand-600 text-sm mr-1">{l.tripKm} km</p>
              <button onClick={() => startEdit(l)} className="text-slate-400 hover:text-brand-600 text-xs font-semibold px-1.5">Edit</button>
              <button onClick={() => remove(l.entryId)} className="text-slate-300 hover:text-rust text-lg leading-none px-1">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
