import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { dashboardLogin } from '../api/sheetApi.js'

export default function PortalLogin({ portal }) {
  const isHRPortal = portal === 'hr'
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await dashboardLogin(employeeId.trim(), password)
      const emp = res.employee

      if (isHRPortal && !emp.isHR) {
        setError('This account is not registered as HR / Admin. Use the Employee Dashboard instead.')
        setLoading(false)
        return
      }
      if (!isHRPortal && emp.isHR) {
        setError('This is an HR / Admin account. Please use the HR / Admin Dashboard login instead.')
        setLoading(false)
        return
      }

      sessionStorage.setItem('dashboardEmployee', JSON.stringify(emp))
      navigate(isHRPortal ? '/hr-dashboard' : '/employee-dashboard')
    } catch (err) {
      setError(err.message || 'Invalid Employee ID or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-5 pt-10 max-w-md mx-auto">
      <div className="text-center mb-8 animate-fadeUp">
        <div
          className={`w-16 h-16 mx-auto rounded-2xl shadow-soft flex items-center justify-center mb-3 ${
            isHRPortal ? 'bg-gradient-to-br from-ink to-brand-800' : 'bg-gradient-to-br from-brand-500 to-brand-700'
          }`}
        >
          {isHRPortal ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M7 9h10M7 13h6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <p className="text-brand-600 text-xs font-semibold tracking-widest uppercase">{isHRPortal ? 'HR / Admin Access' : 'Employee Access'}</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1">{isHRPortal ? 'HR Dashboard Login' : 'Employee Dashboard Login'}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {isHRPortal
            ? 'For authorized HR / Admin accounts only — manage salary & approve leave requests.'
            : 'Enter your Employee ID and password to view your attendance & apply for leave.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-2xl p-5 border border-brand-50 shadow-card animate-popIn">
        <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Employee ID (e.g. SV-OFC-0001)" className="input" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input" />
        {error && <p className="text-rust text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full btn-primary py-3">
          {loading ? 'Checking…' : isHRPortal ? 'Login to HR Dashboard' : 'Login to Employee Dashboard'}
        </button>
      </form>

      <Link to="/dashboard-login" className="block text-center text-xs text-slate-400 mt-4">
        ← Back to dashboard chooser
      </Link>
    </div>
  )
}
