import React, { useState } from 'react'
import { setAttendancePassword } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'

export default function AttendancePasswordManager() {
  const showToast = useToast()
  const [pw, setPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!pw || pw.length < 4) {
      showToast('Password must be at least 4 characters', 'error')
      return
    }
    if (pw !== confirmPw) {
      showToast('Passwords do not match', 'error')
      return
    }
    setSaving(true)
    try {
      await setAttendancePassword(pw)
      showToast('Attendance password updated', 'success')
      setPw('')
      setConfirmPw('')
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card space-y-3">
      <div>
        <p className="font-display font-semibold text-ink text-sm mb-1">Attendance Password</p>
        <p className="text-xs text-slate-400">
          Everyone must enter this password before they can view or mark attendance on the Attendance page. Update it
          any time — the new password applies immediately, everywhere.
        </p>
      </div>

      <div>
        <label className="block text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wide">New Password</label>
        <input
          type="text"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Enter new password"
          className="input py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wide">Confirm Password</label>
        <input
          type="text"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Re-enter new password"
          className="input py-2 text-sm"
        />
      </div>

      <button onClick={save} disabled={saving} className="w-full btn-primary py-2.5 text-sm">
        {saving ? 'Saving…' : 'Save Password'}
      </button>

      <p className="text-[10px] text-slate-400">
        Default password is <span className="font-mono">1234</span> until you set a new one here.
      </p>
    </div>
  )
}
