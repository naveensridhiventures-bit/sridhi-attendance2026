import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMonthlyAttendance, applyLeave, getLeaveRequests } from '../api/sheetApi.js'
import QRCodeDisplay from '../components/QRCodeDisplay.jsx'

const STATUS_STYLE = {
  present: 'bg-brand-500 text-white',
  weekoff: 'bg-gold-500 text-white',
  na: 'bg-rust text-white',
  absent: 'bg-slate-300 text-slate-600'
}

export default function EmployeeDashboard() {
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [month, setMonth] = useState(() => new Date())
  const [days, setDays] = useState([])
  const [loadingCal, setLoadingCal] = useState(true)
  const [leaveRequests, setLeaveRequests] = useState([])
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ type: 'leave', fromDate: '', toDate: '', reason: '' })
  const [submittingLeave, setSubmittingLeave] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('dashboardEmployee')
    if (!stored) {
      navigate('/dashboard-login')
      return
    }
    setEmployee(JSON.parse(stored))
  }, [navigate])

  useEffect(() => {
    if (!employee) return
    loadCalendar()
    loadLeaves()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee, month])

  async function loadCalendar() {
    setLoadingCal(true)
    try {
      const res = await getMonthlyAttendance(employee.employeeId, month.getFullYear(), month.getMonth() + 1)
      setDays(res.days || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingCal(false)
    }
  }

  async function loadLeaves() {
    try {
      const res = await getLeaveRequests(employee.employeeId)
      setLeaveRequests(res.requests || [])
    } catch (e) {
      console.error(e)
    }
  }

  function logout() {
    sessionStorage.removeItem('dashboardEmployee')
    navigate('/')
  }

  function changeMonth(delta) {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  }

  async function submitLeave(e) {
    e.preventDefault()
    if (!leaveForm.fromDate) return
    setSubmittingLeave(true)
    try {
      await applyLeave({ ...leaveForm, employeeId: employee.employeeId, name: employee.name })
      setLeaveForm({ type: 'leave', fromDate: '', toDate: '', reason: '' })
      setShowLeaveForm(false)
      loadLeaves()
    } catch (e) {
      alert('Failed: ' + e.message)
    } finally {
      setSubmittingLeave(false)
    }
  }

  const summary = useMemo(() => {
    const s = { present: 0, weekoff: 0, na: 0, absent: 0 }
    days.forEach((d) => {
      if (d.status && s[d.status] !== undefined) s[d.status]++
    })
    return s
  }, [days])

  const monthLabel = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay()

  if (!employee) return null

  return (
    <div className="px-5 pt-6 max-w-md mx-auto pb-4">
      <header className="mb-5 flex items-start justify-between animate-fadeUp">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-display font-bold text-lg shrink-0">
            {employee.name.charAt(0)}
          </div>
          <div>
            <p className="text-brand-600 text-[11px] font-semibold tracking-widest uppercase capitalize">{employee.type} Staff</p>
            <h1 className="font-display text-lg font-bold text-ink leading-tight">{employee.name}</h1>
            <p className="text-slate-400 text-xs">{employee.role || employee.employeeId}</p>
          </div>
        </div>
        <button onClick={logout} className="text-xs text-slate-500 border border-brand-100 bg-white rounded-lg px-3 py-1.5 h-fit">
          Logout
        </button>
      </header>

      {/* Monthly calendar */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card mb-4 animate-popIn">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg bg-surface text-brand-600 font-bold">‹</button>
          <p className="font-display font-semibold text-ink text-sm">{monthLabel}</p>
          <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-lg bg-surface text-brand-600 font-bold">›</button>
        </div>

        {loadingCal ? (
          <div className="h-40 rounded-xl skeleton" />
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <span key={'pad' + i} />
              ))}
              {days.map((d) => (
                <div
                  key={d.date}
                  className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-semibold ${
                    d.status ? STATUS_STYLE[d.status] : 'bg-surface text-slate-400'
                  }`}
                >
                  {Number(d.date.split('-')[2])}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-slate-500">
              <Legend color="bg-brand-500" label={`Present (${summary.present})`} />
              <Legend color="bg-gold-500" label={`Week Off (${summary.weekoff})`} />
              <Legend color="bg-rust" label={`N/A (${summary.na})`} />
            </div>
          </>
        )}
      </div>

      {/* Leave */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-semibold text-ink text-sm">Leave / Permission</p>
          <button onClick={() => setShowLeaveForm((s) => !s)} className="text-xs font-semibold text-brand-600">
            {showLeaveForm ? 'Cancel' : '+ Apply'}
          </button>
        </div>

        {showLeaveForm && (
          <form onSubmit={submitLeave} className="space-y-2.5 mb-3 animate-popIn">
            <div className="grid grid-cols-2 gap-2">
              {['leave', 'permission'].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setLeaveForm((f) => ({ ...f, type: t }))}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize border ${
                    leaveForm.type === t ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-slate-500 border-brand-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="date"
              required
              value={leaveForm.fromDate}
              onChange={(e) => setLeaveForm((f) => ({ ...f, fromDate: e.target.value }))}
              className="input"
            />
            <input
              type="date"
              value={leaveForm.toDate}
              onChange={(e) => setLeaveForm((f) => ({ ...f, toDate: e.target.value }))}
              className="input"
              placeholder="To date (optional)"
            />
            <textarea
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))}
              className="input"
              rows={2}
              placeholder="Reason"
            />
            <button type="submit" disabled={submittingLeave} className="w-full btn-primary py-2.5 text-sm">
              {submittingLeave ? 'Submitting…' : 'Submit Request'}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {leaveRequests.map((r) => (
            <div key={r.requestId} className="flex items-center justify-between bg-surface rounded-xl p-2.5 text-xs">
              <div>
                <p className="font-medium text-ink capitalize">{r.type} · {r.fromDate}{r.toDate ? ' to ' + r.toDate : ''}</p>
                <p className="text-slate-400">{r.reason}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full font-semibold text-[10px] capitalize ${
                  r.status === 'approved' ? 'bg-brand-100 text-brand-700' : r.status === 'rejected' ? 'bg-rust/10 text-rust' : 'bg-gold-500/15 text-gold-500'
                }`}
              >
                {r.status}
              </span>
            </div>
          ))}
          {leaveRequests.length === 0 && <p className="text-slate-400 text-xs text-center py-3">No requests yet.</p>}
        </div>
      </div>

      <QRCodeDisplay employeeId={employee.employeeId} employeeName={employee.name} size={170} />
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  )
}
