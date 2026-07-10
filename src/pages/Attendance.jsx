import React, { useEffect, useMemo, useState } from 'react'
import QRScanner from '../components/QRScanner.jsx'
import { getEmployees, markAttendance, applyLeave } from '../api/sheetApi.js'
import PersonAvatar from '../components/PersonAvatar.jsx'
import EnergyParticles from '../components/EnergyParticles.jsx'
import Confetti from '../components/Confetti.jsx'
import { getHeroImage } from '../api/sheetApi.js'
import { useToast } from '../components/Toast.jsx'
import { haptics } from '../utils/haptics.js'
import { STATUS_OPTIONS, getStatusMeta } from '../utils/attendanceStatus.js'
import EmployeePicker from '../components/EmployeePicker.jsx'
import BulkAttendance from '../components/BulkAttendance.jsx'

const REASONS = ['Personal Work', 'Medical / Health', 'Family Emergency', 'Bank / Govt Work', 'Vehicle Issue', 'Other']
const HOURS = ['30m', '1 HR', '2 HRS', '3 HRS', '4 HRS']

export default function Attendance() {
  const showToast = useToast()
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [mode, setMode] = useState('mark')
  const [heroImage, setHeroImage] = useState(null) // { imageUrl, caption }
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [marked, setMarked] = useState({})
  const [justMarked, setJustMarked] = useState([]) // employeeIds marked in this session, for the "✓ Just marked" badge

  // single-employee marking flow (mirrors the live attendance form)
  const [selectedId, setSelectedId] = useState('')
  const [status, setStatus] = useState('')
  const [location, setLocation] = useState(null)
  const [locStatus, setLocStatus] = useState('idle') // idle | locating | done | error
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  // permission flow
  const [permId, setPermId] = useState('')
  const [permReason, setPermReason] = useState(REASONS[0])
  const [permHours, setPermHours] = useState(HOURS[1])
  const [permSubmitting, setPermSubmitting] = useState(false)

  // qr mode
  const [qrPaused, setQrPaused] = useState(false)
  const [qrResult, setQrResult] = useState(null)

  useEffect(() => {
    load()
    getHeroImage()
      .then((d) => { if (d.heroImage?.imageUrl) setHeroImage(d.heroImage) })
      .catch(() => {})
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getEmployees()
      const list = (data.employees || []).sort((a, b) => a.name.localeCompare(b.name))
      setEmployees(list)
      const already = {}
      list.forEach((e) => {
        if (e.todayStatus) already[e.employeeId] = e.todayStatus
      })
      setMarked(already)
    } catch (e) {
      setToast({ ok: false, message: e.message })
    } finally {
      setLoading(false)
    }
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocStatus('error')
      return
    }
    setLocStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) })
        setLocStatus('done')
      },
      () => setLocStatus('error'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const markedCount = Object.keys(marked).length
  const totalCount = employees.length
  const unmarked = employees.filter((e) => !marked[e.employeeId])

  async function submitAttendance() {
    if (!selectedId || !status) {
      setToast({ ok: false, message: 'Choose an employee and a status first.' })
      return
    }
    setSubmitting(true)
    setToast(null)
    try {
      await markAttendance({ employeeId: selectedId, status, mode: 'manual', location })
      setMarked((m) => ({ ...m, [selectedId]: status }))
      setJustMarked((j) => [...j, selectedId])
      const emp = employees.find((e) => e.employeeId === selectedId)
      const statusLabel = getStatusMeta(status).full
      setToast({ ok: true, message: `${emp?.name || selectedId} marked ${statusLabel}` })
      showToast(`${emp?.name || selectedId} marked ${statusLabel}`, 'success')
      haptics.success()
      if (status === 'present' || status === 'wop') setConfettiTrigger((c) => c + 1)
      setSelectedId('')
      setStatus('')
    } catch (e) {
      setToast({ ok: false, message: e.message })
      showToast(e.message, 'error')
      haptics.error()
    } finally {
      setSubmitting(false)
    }
  }

  async function submitPermission() {
    if (!permId) {
      setToast({ ok: false, message: 'Choose an employee for the permission entry.' })
      return
    }
    setPermSubmitting(true)
    try {
      const emp = employees.find((e) => e.employeeId === permId)
      await applyLeave({
        employeeId: permId,
        name: emp?.name || '',
        type: 'permission',
        fromDate: new Date().toISOString().slice(0, 10),
        toDate: '',
        reason: `${permReason} - ${permHours}`
      })
      setToast({ ok: true, message: `Permission recorded for ${emp?.name}` })
      showToast(`Permission recorded for ${emp?.name}`, 'info')
      setPermId('')
    } catch (e) {
      setToast({ ok: false, message: e.message })
      showToast(e.message, 'error')
    } finally {
      setPermSubmitting(false)
    }
  }

  async function handleQrScan(decodedText) {
    setQrPaused(true)
    setQrResult(null)
    try {
      const employeeId = decodedText.trim()
      const res = await markAttendance({ employeeId, status: 'present', mode: 'qr', location })
      setQrResult({ ok: true, message: 'Attendance marked', name: res.employeeName, id: employeeId, time: res.time })
      setMarked((m) => ({ ...m, [employeeId]: 'present' }))
      showToast(`${res.employeeName} checked in via QR`, 'success')
      setConfettiTrigger((c) => c + 1)
    } catch (e) {
      setQrResult({ ok: false, message: e.message })
      showToast(e.message, 'error')
    } finally {
      setTimeout(() => setQrPaused(false), 1600)
    }
  }

  return (
    <div>
      <Confetti trigger={confettiTrigger} />
      {/* Hero header */}
      <div className="aurora-bg rounded-b-[2rem] px-5 pt-7 pb-7 shadow-soft relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-white/10" />
        <div className="relative max-w-md mx-auto animate-fadeUp">
          <EnergyParticles />
          {heroImage?.imageUrl ? (
            <HeroImageBadge imageUrl={heroImage.imageUrl} caption={heroImage.caption} />
          ) : (
            <PersonAvatar size={104} side="right" />
          )}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
            <span className="text-brand-50 text-[11px] font-semibold tracking-widest uppercase">Live Attendance System</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-shimmer leading-tight">
            Mark Today's <span className="text-gold-400">Attendance</span>
          </h1>
          <div className="grid grid-cols-3 gap-2 mt-5">
            <HeroStat value={totalCount} label="Active Staff" />
            <HeroStat value={markedCount} label="Marked Today" />
            <HeroStat value={Math.max(totalCount - markedCount, 0)} label="Pending" />
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 max-w-md mx-auto relative z-10 pb-4">
        {/* Mode switch */}
        <div className="grid grid-cols-4 gap-1.5 mb-4 bg-white p-1.5 rounded-2xl border border-brand-100 shadow-card">
          {[
            { key: 'mark', label: 'Mark' },
            { key: 'bulk', label: 'Bulk' },
            { key: 'qr', label: 'QR Scan' },
            { key: 'permission', label: 'Permission' }
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`py-2 rounded-xl text-[11px] font-semibold transition-all ${
                mode === m.key ? 'bg-brand-500 text-white shadow-soft' : 'text-slate-500'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {toast && (
          <div
            className={`mb-4 rounded-2xl p-3.5 border text-sm font-medium animate-popIn ${
              toast.ok ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-rust/10 border-rust text-rust'
            }`}
          >
            {toast.ok ? '✓ ' : '✕ '}
            {toast.message}
          </div>
        )}

        {mode === 'mark' && (
          <div className="bg-white rounded-3xl p-5 border border-brand-50 shadow-card animate-popIn space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Select Employee</label>
              <EmployeePicker
                employees={employees}
                marked={marked}
                value={selectedId}
                onChange={setSelectedId}
                recentIds={justMarked}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Attendance Status</label>
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
              <p className="text-[10px] text-slate-400 mt-1">Required for attendance submission</p>
            </div>

            <button onClick={submitAttendance} disabled={submitting} className="w-full btn-primary py-3.5">
              {submitting ? 'Submitting…' : '✓ Submit Attendance'}
            </button>
          </div>
        )}

        {mode === 'bulk' && (
          <BulkAttendance
            employees={employees}
            marked={marked}
            setMarked={setMarked}
            location={location}
            locStatus={locStatus}
            captureLocation={captureLocation}
            onDone={() => setConfettiTrigger((c) => c + 1)}
          />
        )}

        {mode === 'qr' && (
          <div className="animate-popIn">
            <QRScanner onScan={handleQrScan} paused={qrPaused} />
            {qrResult && (
              <div
                className={`mt-4 rounded-2xl p-4 border animate-popIn ${
                  qrResult.ok ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-rust/10 border-rust text-rust'
                }`}
              >
                <p className="font-display font-semibold">{qrResult.ok ? '✓ ' + qrResult.message : '✕ ' + qrResult.message}</p>
                {qrResult.ok && (
                  <p className="text-sm mt-1 text-slate-600">
                    {qrResult.name} ({qrResult.id}) — {qrResult.time}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'permission' && (
          <div className="bg-white rounded-3xl p-5 border border-brand-50 shadow-card animate-popIn space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <span className="text-lg">⏱</span>
              <p className="font-display font-semibold text-sm">Mark Permission</p>
            </div>
            <p className="text-xs text-slate-400 -mt-2">Record early leave or late arrival hours for an employee.</p>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Employee Name</label>
              <EmployeePicker
                employees={employees}
                marked={marked}
                value={permId}
                onChange={setPermId}
                recentIds={justMarked}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Reason</label>
              <div className="grid grid-cols-2 gap-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setPermReason(r)}
                    className={`py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      permReason === r ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-slate-500 border-brand-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">No. of Hours</label>
              <div className="grid grid-cols-5 gap-1.5">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setPermHours(h)}
                    className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                      permHours === h ? 'bg-gold-500 text-white border-gold-500' : 'bg-surface text-slate-500 border-brand-100'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={submitPermission} disabled={permSubmitting} className="w-full btn-primary py-3.5">
              {permSubmitting ? 'Submitting…' : '⏱ Submit Permission'}
            </button>
          </div>
        )}

        {/* Not yet marked */}
        {mode === 'mark' && !loading && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              ⚠ Not yet marked ({unmarked.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unmarked.slice(0, 30).map((e) => (
                <span key={e.employeeId} className="text-[11px] bg-white border border-brand-100 text-slate-500 rounded-full px-3 py-1">
                  {e.name}
                </span>
              ))}
              {unmarked.length === 0 && <span className="text-xs text-brand-600">Everyone is marked for today 🎉</span>}
            </div>
          </div>
        )}

        {loading && <div className="h-32 rounded-2xl skeleton mt-4" />}
      </div>
    </div>
  )
}

function HeroStat({ value, label }) {
  return (
    <div className="bg-white/10 rounded-xl py-2.5 px-2 text-center backdrop-blur-sm">
      <p className="font-display font-bold text-white text-lg">{value}</p>
      <p className="text-brand-100 text-[10px] mt-0.5">{label}</p>
    </div>
  )
}


// Shows the HR-uploaded Cloudinary image as a floating animated badge in the hero
function HeroImageBadge({ imageUrl, caption }) {
  return (
    <div className="absolute -top-2 right-1 pointer-events-none animate-avatarFloat" style={{ width: 108 }}>
      <div className="relative">
        {/* Rotating ring */}
        <svg className="absolute -inset-1.5" viewBox="0 0 100 100" style={{ width: 120, height: 120 }}>
          <circle cx="50" cy="50" r="47" fill="none" stroke="#F2D98A" strokeWidth="2" strokeDasharray="6 8" className="animate-ringSpin" style={{ transformOrigin: '50% 50%' }} />
        </svg>
        {/* Glow */}
        <div className="absolute -inset-2 rounded-2xl opacity-70 blur-md animate-avatarGlow" style={{ background: 'linear-gradient(135deg,#F2D98A,#1F9D4C)' }} />
        {/* Image */}
        <div className="relative rounded-2xl overflow-hidden border-[3px] border-white shadow-xl" style={{ width: 108, height: 108 }}>
          <img src={imageUrl} alt="HR announcement" className="w-full h-full object-cover" />
          {caption && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 px-1.5 py-1">
              <p className="text-white text-[9px] font-medium text-center leading-tight truncate">{caption}</p>
            </div>
          )}
        </div>
        {/* Sparkles */}
        <span className="absolute -top-2 left-1 w-2 h-2 rounded-full bg-gold-300 animate-sparkleFloat" />
        <span className="absolute top-2 -left-3 w-1.5 h-1.5 rounded-full bg-white animate-sparkleFloat" style={{ animationDelay: '0.5s' }} />
        <span className="absolute -top-1 right-0 w-1.5 h-1.5 rounded-full bg-gold-200 animate-sparkleFloat" style={{ animationDelay: '0.9s' }} />
      </div>
    </div>
  )
}
