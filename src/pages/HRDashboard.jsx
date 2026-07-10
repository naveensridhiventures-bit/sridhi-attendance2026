import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllEmployeesFull, updateSalary, getAllLeaveRequests, updateLeaveStatus } from '../api/sheetApi.js'
import { useToast } from '../components/Toast.jsx'
import HeroImageUploader from '../components/HeroImageUploader.jsx'
import MessageComposer from '../components/MessageComposer.jsx'
import MonthlySalaryView from '../components/MonthlySalaryView.jsx'
import LogsView from '../components/LogsView.jsx'
import AbsenteeWhatsApp from '../components/AbsenteeWhatsApp.jsx'

export default function HRDashboard() {
  const showToast = useToast()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [tab, setTab] = useState('salary') // 'salary' | 'leave'
  const [employees, setEmployees] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('dashboardEmployee')
    if (!stored) {
      navigate('/dashboard-login')
      return
    }
    const emp = JSON.parse(stored)
    if (!emp.isHR) {
      navigate('/employee-dashboard')
      return
    }
    setEmployee(emp)
    loadAll()
  }, [navigate])

  async function loadAll() {
    setLoading(true)
    try {
      const [empRes, leaveRes] = await Promise.all([getAllEmployeesFull(), getAllLeaveRequests('pending')])
      setEmployees(empRes.employees || [])
      setLeaveRequests(leaveRes.requests || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    sessionStorage.removeItem('dashboardEmployee')
    navigate('/')
  }

  function startEdit(emp) {
    setEditingId(emp.employeeId)
    setEditValue(emp.salary || '')
  }

  async function saveSalary(employeeId) {
    setSavingId(employeeId)
    try {
      await updateSalary(employeeId, editValue)
      setEmployees((list) => list.map((e) => (e.employeeId === employeeId ? { ...e, salary: editValue } : e)))
      setEditingId(null)
      showToast('Salary updated', 'success')
    } catch (e) {
      alert('Failed: ' + e.message)
    } finally {
      setSavingId(null)
    }
  }

  async function actOnLeave(requestId, status) {
    try {
      await updateLeaveStatus(requestId, status, '')
      setLeaveRequests((list) => list.filter((r) => r.requestId !== requestId))
      showToast(`Request ${status}`, status === 'approved' ? 'success' : 'info')
    } catch (e) {
      alert('Failed: ' + e.message)
    }
  }

  const filteredEmployees = employees.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.employeeId.toLowerCase().includes(search.toLowerCase())
  )

  if (!employee) return null

  return (
    <div className="px-5 pt-6 max-w-md mx-auto pb-4">
      <header className="mb-5 flex items-center justify-between animate-fadeUp">
        <div>
          <p className="text-brand-600 text-[11px] font-semibold tracking-widest uppercase">HR / Admin</p>
          <h1 className="font-display text-xl font-bold text-ink leading-tight">{employee.name}</h1>
        </div>
        <button onClick={logout} className="text-xs text-slate-500 border border-brand-100 bg-white rounded-lg px-3 py-1.5">
          Logout
        </button>
      </header>

      <div className="grid grid-cols-3 gap-1.5 mb-5 bg-white p-1.5 rounded-2xl border border-brand-100 shadow-card">
        {[
          { key: 'salary',   label: 'Salary',   icon: '₹' },
          { key: 'leave',    label: 'Leave',    icon: '📋' },
          { key: 'logs',     label: 'Logs',     icon: '🕒' },
          { key: 'hero',     label: 'Hero',     icon: '🖼' },
          { key: 'msg',      label: 'Message',  icon: '📣' },
          { key: 'absent',   label: 'Absent',   icon: '📲' }
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative py-2 rounded-xl text-[11px] font-semibold transition-all flex flex-col items-center gap-0.5 ${tab === t.key ? 'bg-brand-500 text-white shadow-soft' : 'text-slate-500'}`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            {t.label}
            {t.key === 'leave' && leaveRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rust text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {leaveRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'salary' && (
        <div className="animate-popIn space-y-4">
          {/* Quick salary edit per employee */}
          <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card">
            <p className="font-display font-semibold text-ink text-sm mb-3">Set Monthly Salary</p>
            <input
              type="text"
              placeholder="Search employee…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input mb-3"
            />
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {filteredEmployees.map((e) => (
                <div key={e.employeeId} className="flex items-center justify-between bg-surface rounded-xl px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium text-xs text-ink truncate">{e.name}</p>
                    <p className="text-[10px] text-slate-400">{e.employeeId}</p>
                  </div>
                  {editingId === e.employeeId ? (
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={editValue} onChange={(ev) => setEditValue(ev.target.value)}
                        className="w-20 input py-1 px-2 text-xs" autoFocus />
                      <button onClick={() => saveSalary(e.employeeId)} disabled={savingId === e.employeeId}
                        className="bg-brand-500 text-white text-xs font-semibold rounded-lg px-2 py-1">
                        {savingId === e.employeeId ? '…' : '✓'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(e)} className="text-right">
                      <p className="text-xs font-semibold text-brand-600">₹{e.salary || '—'}</p>
                      <p className="text-[9px] text-slate-400">tap to edit</p>
                    </button>
                  )}
                </div>
              ))}
              {!loading && filteredEmployees.length === 0 && <p className="text-slate-400 text-xs text-center py-3">No employees found.</p>}
            </div>
          </div>

          {/* Monthly salary summary view */}
          <p className="font-display font-semibold text-ink text-sm">Monthly Salary Sheet</p>
          <MonthlySalaryView />
        </div>
      )}

      {tab === 'leave' && (
        <div className="animate-popIn space-y-2.5">
          {loading && (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-2xl skeleton" />
              ))}
            </div>
          )}
          {leaveRequests.map((r) => (
            <div key={r.requestId} className="bg-white border border-brand-50 rounded-2xl p-3.5 shadow-card">
              <p className="font-medium text-sm text-ink">
                {r.name} <span className="text-slate-400 font-normal">({r.employeeId})</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">
                {r.type} · {r.fromDate}
                {r.toDate ? ' to ' + r.toDate : ''}
              </p>
              {r.reason && <p className="text-xs text-slate-400 mt-1">"{r.reason}"</p>}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => actOnLeave(r.requestId, 'approved')}
                  className="flex-1 bg-brand-500 text-white text-xs font-semibold rounded-lg py-2"
                >
                  Approve
                </button>
                <button
                  onClick={() => actOnLeave(r.requestId, 'rejected')}
                  className="flex-1 bg-rust text-white text-xs font-semibold rounded-lg py-2"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {!loading && leaveRequests.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No pending requests. 🎉</p>}
        </div>
      )}

      {tab === 'logs' && (
        <div className="animate-popIn">
          <LogsView />
        </div>
      )}

      {tab === 'hero' && (
        <div className="animate-popIn">
          <HeroImageUploader />
        </div>
      )}

      {tab === 'msg' && (
        <div className="animate-popIn">
          <MessageComposer hrName={employee?.name} />
        </div>
      )}

      {tab === 'absent' && (
        <div className="animate-popIn">
          <AbsenteeWhatsApp />
        </div>
      )}
    </div>
  )
}
