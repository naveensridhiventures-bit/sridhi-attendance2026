import React, { useState } from 'react'
import { addEmployee } from '../api/sheetApi.js'
import QRCodeDisplay from '../components/QRCodeDisplay.jsx'
import TopBar from '../components/TopBar.jsx'
import { useToast } from '../components/Toast.jsx'

const initialForm = { name: '', type: 'office', isHR: false, phone: '', role: '', joinDate: '', salary: '' }

export default function AddEmployee() {
  const showToast = useToast()
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await addEmployee(form)
      setCreated({ employeeId: res.employeeId, name: form.name, password: res.password })
      showToast(`${form.name} added — ID ${res.employeeId}`, 'success')
      setForm(initialForm)
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-5 pt-6 max-w-md mx-auto">
      <TopBar eyebrow="Employee Management" title="Add New Employee" subtitle="Employee ID, login password and QR code are generated automatically on submit." />

      {!created ? (
        <form onSubmit={handleSubmit} className="space-y-3.5 bg-white rounded-2xl p-4 border border-brand-50 shadow-card">
          <Field label="Full Name">
            <input value={form.name} onChange={(e) => update('name', e.target.value)} className="input" placeholder="e.g. Ramesh Kumar" />
          </Field>

          <Field label="Employee Type">
            <div className="grid grid-cols-2 gap-2">
              {['office', 'production'].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => update('type', t)}
                  className={`py-2.5 rounded-xl text-sm font-semibold capitalize border transition-all ${
                    form.type === t ? 'bg-brand-500 text-white border-brand-500 shadow-soft' : 'bg-surface text-slate-500 border-brand-100'
                  }`}
                >
                  {t === 'office' ? 'Office (QR)' : 'Production (Supervisor)'}
                </button>
              ))}
            </div>
          </Field>

          {form.type === 'office' && (
            <label className="flex items-center gap-2 text-sm text-slate-600 bg-surface rounded-xl px-3 py-2.5 border border-brand-100">
              <input type="checkbox" checked={form.isHR} onChange={(e) => update('isHR', e.target.checked)} className="accent-brand-500 w-4 h-4" />
              This employee is an HR / Admin (gets access to salary &amp; leave approval dashboard)
            </label>
          )}

          <Field label="Phone Number (optional)">
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input" placeholder="10-digit number" />
          </Field>

          <Field label="Role / Designation">
            <input value={form.role} onChange={(e) => update('role', e.target.value)} className="input" placeholder="e.g. Accountant / Line Operator" />
          </Field>

          <Field label="Monthly Salary (₹, optional)">
            <input type="number" value={form.salary} onChange={(e) => update('salary', e.target.value)} className="input" placeholder="e.g. 18000" />
          </Field>

          <Field label="Joining Date">
            <input type="date" value={form.joinDate} onChange={(e) => update('joinDate', e.target.value)} className="input" />
          </Field>

          {error && <p className="text-rust text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full btn-primary py-3 mt-1">
            {submitting ? 'Saving…' : 'Save Employee & Generate ID'}
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-popIn">
          <div className="bg-brand-50 border border-brand-300 text-brand-700 rounded-2xl p-4">
            <p className="font-display font-semibold">✓ Employee added successfully</p>
            <p className="text-sm mt-1">Login password: <span className="font-mono font-bold">{created.password}</span> — share this with the employee securely.</p>
          </div>
          <QRCodeDisplay employeeId={created.employeeId} employeeName={created.name} />
          <button onClick={() => setCreated(null)} className="w-full bg-white border border-brand-100 rounded-xl py-3 text-sm font-medium text-slate-600">
            Add Another Employee
          </button>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  )
}
