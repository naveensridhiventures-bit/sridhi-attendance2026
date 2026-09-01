import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMonthlyAttendance, applyLeave, getLeaveRequests, getEmployeeSalary, getDeductionsForEmployee, getPermissionsForEmployeeMonth } from '../api/sheetApi.js'
import SalaryPayslip from '../components/SalaryPayslip.jsx'
import QRCodeDisplay from '../components/QRCodeDisplay.jsx'

// Matches the exact colors already used for P / A / WO / WOP / NA in the
// Google Sheet itself (see COLORS in Code.gs), so a day looks the same
// whether HR is looking at the spreadsheet or the employee is looking at
// their phone. 'wop' was previously missing here entirely, which meant a
// WOP day rendered with NO background at all — an invisible calendar cell.
const STATUS_STYLE = {
  present: 'bg-emerald-500 text-white',   // sheet: P = green
  absent:  'bg-red-500 text-white',       // sheet: A = red
  weekoff: 'bg-yellow-400 text-ink',      // sheet: WO = yellow
  wop:     'bg-purple-600 text-white',    // sheet: WOP = purple
  na:      'bg-blue-600 text-white'       // sheet: NA = blue
}

const PERM_REASONS = ['Personal Work', 'Medical / Health', 'Family Emergency', 'Bank / Govt Work', 'Vehicle Issue', 'Other']
const PERM_HOURS = ['30m', '1 HR', '2 HRS', '3 HRS', '4 HRS']

function todayISO() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export default function EmployeeDashboard() {
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [month, setMonth] = useState(() => new Date())
  const [days, setDays] = useState([])
  const [loadingCal, setLoadingCal] = useState(true)
  const [leaveRequests, setLeaveRequests] = useState([])
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ type: 'leave', fromDate: '', toDate: '', reason: '', permReason: PERM_REASONS[0], permHours: PERM_HOURS[1] })
  const [submittingLeave, setSubmittingLeave] = useState(false)
  const [permissionHistory, setPermissionHistory] = useState([])
  const [loadingPermissions, setLoadingPermissions] = useState(true)
  const [salary, setSalary] = useState(null)
  const [deductions, setDeductions] = useState([])
  const [loadingSalary, setLoadingSalary] = useState(true)

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
    loadSalary()
    loadPermissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee, month])

  async function loadPermissions() {
    setLoadingPermissions(true)
    try {
      const res = await getPermissionsForEmployeeMonth(employee.employeeId, month.getFullYear(), month.getMonth() + 1)
      setPermissionHistory(res.requests || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPermissions(false)
    }
  }

  async function loadSalary() {
    setLoadingSalary(true)
    try {
      const y = month.getFullYear(), m = month.getMonth() + 1
      const [salRes, dedRes] = await Promise.all([
        getEmployeeSalary(employee.employeeId, y, m),
        getDeductionsForEmployee(employee.employeeId, y, m)
      ])
      setSalary(salRes.salary || null)
      setDeductions(dedRes.entries || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSalary(false)
    }
  }

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
      const payload = leaveForm.type === 'permission'
        ? {
            employeeId: employee.employeeId, name: employee.name, type: 'permission',
            fromDate: leaveForm.fromDate, toDate: '',
            reason: `${leaveForm.permReason} - ${leaveForm.permHours}`
          }
        : {
            employeeId: employee.employeeId, name: employee.name, type: 'leave',
            fromDate: leaveForm.fromDate, toDate: leaveForm.toDate, reason: leaveForm.reason
          }
      await applyLeave(payload)
      setLeaveForm({ type: 'leave', fromDate: '', toDate: '', reason: '', permReason: PERM_REASONS[0], permHours: PERM_HOURS[1] })
      setShowLeaveForm(false)
      loadLeaves()
      loadPermissions()
    } catch (e) {
      alert('Failed: ' + e.message)
    } finally {
      setSubmittingLeave(false)
    }
  }

  const summary = useMemo(() => {
    const s = { present: 0, weekoff: 0, wop: 0, na: 0, absent: 0 }
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
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 text-[10px] text-slate-500">
              <Legend color="bg-emerald-500" label={`Present (${summary.present})`} />
              <Legend color="bg-red-500" label={`Absent (${summary.absent})`} />
              <Legend color="bg-yellow-400" label={`Week Off (${summary.weekoff})`} />
              <Legend color="bg-purple-600" label={`WOP (${summary.wop})`} />
              <Legend color="bg-blue-600" label={`N/A (${summary.na})`} />
            </div>
          </>
        )}
      </div>

      {/* Salary */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card mb-4 animate-popIn">
        <p className="font-display font-semibold text-ink text-sm mb-3">My Salary · {monthLabel}</p>
        {loadingSalary ? (
          <div className="h-24 rounded-xl skeleton" />
        ) : !salary ? (
          <p className="text-slate-400 text-xs text-center py-4">No salary data yet for {monthLabel}.</p>
        ) : (
          <>
            <div
              className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 cell-pattern p-4 mb-3 shadow-soft"
              style={{ backgroundColor: '#0F6630' }}
            >
              <p className="text-brand-100 text-[11px] font-semibold uppercase tracking-wide mb-1">Net Salary</p>
              <p className="font-display font-extrabold text-white text-[28px] leading-tight">
                ₹{parseFloat(salary.FinalSalary || 0).toLocaleString('en-IN')}
              </p>
              {month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth() && (
                <p className="text-brand-100 text-[10px] mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulseRing"></span>
                  Live · updates as attendance is marked
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-center mb-3">
              <div className="bg-surface rounded-xl py-2">
                <p className="font-bold text-sm text-ink">₹{parseFloat(salary.MonthlySalary || 0).toLocaleString('en-IN')}</p>
                <p className="text-[9px] text-slate-400">Base (Monthly)</p>
              </div>
              <div className="bg-surface rounded-xl py-2">
                <p className="font-bold text-sm text-rust">− ₹{parseFloat(salary.Deduction || 0).toLocaleString('en-IN')}</p>
                <p className="text-[9px] text-slate-400">Total Deducted</p>
              </div>
            </div>

            {/* Itemized breakdown — exactly how the Net Salary was arrived at */}
            <SalaryPayslip
              earnedSalary={parseFloat(salary.EarnedSalary || 0)}
              deductions={deductions}
              finalSalary={parseFloat(salary.FinalSalary || 0)}
            />
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

            <div>
              <input
                type="date"
                required
                value={leaveForm.fromDate}
                onChange={(e) => setLeaveForm((f) => ({ ...f, fromDate: e.target.value }))}
                className="input"
              />
              {leaveForm.type === 'permission' && leaveForm.fromDate && leaveForm.fromDate !== todayISO() && (
                <p className="text-[10px] text-gold-600 mt-1">
                  {leaveForm.fromDate < todayISO() ? '📅 Reporting a missed permission' : '📅 Requesting a future permission'} for {leaveForm.fromDate}
                </p>
              )}
            </div>

            {leaveForm.type === 'leave' ? (
              <>
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
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wide">Reason</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PERM_REASONS.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setLeaveForm((f) => ({ ...f, permReason: r }))}
                        className={`py-2 rounded-xl text-[10.5px] font-semibold border transition-all ${
                          leaveForm.permReason === r ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-slate-500 border-brand-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wide">No. of Hours</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PERM_HOURS.map((h) => (
                      <button
                        type="button"
                        key={h}
                        onClick={() => setLeaveForm((f) => ({ ...f, permHours: h }))}
                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                          leaveForm.permHours === h ? 'bg-gold-500 text-white border-gold-500' : 'bg-surface text-slate-500 border-brand-100'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={submittingLeave} className="w-full btn-primary py-2.5 text-sm">
              {submittingLeave ? 'Submitting…' : 'Submit Request'}
            </button>
          </form>
        )}

        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-0.5 mb-1.5">Leave Requests</p>
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
          {leaveRequests.length === 0 && <p className="text-slate-400 text-xs text-center py-3">No leave requests yet.</p>}
        </div>

        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-0.5 mb-1.5 mt-4">
          Permission Requests · {month.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
        </p>
        <div className="space-y-2">
          {loadingPermissions && <div className="h-12 rounded-xl skeleton" />}
          {!loadingPermissions && permissionHistory.map((r) => (
            <div key={r.requestId} className="flex items-center justify-between bg-surface rounded-xl p-2.5 text-xs">
              <div>
                <p className="font-medium text-ink">{r.date}{r.hours ? ` · ${r.hours}` : ''}</p>
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
          {!loadingPermissions && permissionHistory.length === 0 && (
            <p className="text-slate-400 text-xs text-center py-3">
              No permission requests for this month. Use the calendar arrows above to check other months.
            </p>
          )}
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
