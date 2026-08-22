import React, { useEffect, useMemo, useState } from 'react'
import { addDeduction, deleteDeduction, updateDeduction, getAllDeductionsForMonth } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'
import EmployeePicker from './EmployeePicker.jsx'
import { downloadExcel, downloadPdf } from '../utils/reportExport.js'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const CATEGORIES = [
  { key: 'Advance',       icon: '💵' },
  { key: 'Penalty',       icon: '⚠️' },
  { key: 'Gas Expense',   icon: '🔥' },
  { key: 'Food Expense',  icon: '🍽️' },
  { key: 'Rice Cost',     icon: '🍚' },
  { key: 'Other',         icon: '📝' }
]

function categoryIconFor(cat) {
  return (CATEGORIES.find((c) => c.key === cat) || {}).icon || '📝'
}

function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export default function DeductionsManager({ employees, hrName }) {
  const showToast = useToast()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const [employeeId, setEmployeeId] = useState('')
  const [date, setDate] = useState(todayStr())
  const [category, setCategory] = useState('Advance')
  const [customCategory, setCustomCategory] = useState('')
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Inline edit state — which entry is being edited + its draft fields
  const [editId, setEditId] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editCustomCategory, setEditCustomCategory] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => { load() }, [year, month])

  async function load() {
    setLoading(true)
    try {
      const res = await getAllDeductionsForMonth(year, month)
      setEntries(res.entries || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function submit() {
    if (!employeeId) { showToast('Choose an employee first.', 'error'); return }
    if (!(parseFloat(amount) > 0)) { showToast('Enter an amount greater than 0.', 'error'); return }
    const finalCategory = category === 'Other' ? (customCategory.trim() || 'Other') : category
    const emp = employees.find((e) => e.employeeId === employeeId)
    setSubmitting(true)
    try {
      await addDeduction({
        employeeId, name: emp?.name || '', date, category: finalCategory,
        note, amount: parseFloat(amount), addedBy: hrName || 'HR'
      })
      showToast(`₹${amount} ${finalCategory} recorded for ${emp?.name}`, 'success')
      setAmount('')
      setNote('')
      setCustomCategory('')
      // reload if this entry lands in the month currently being viewed
      const entryMonth = parseInt(date.split('-')[1], 10)
      const entryYear = parseInt(date.split('-')[0], 10)
      if (entryMonth === month && entryYear === year) load()
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(entryId) {
    try {
      await deleteDeduction(entryId)
      setEntries((list) => list.filter((e) => e.entryId !== entryId))
      setConfirmDeleteId(null)
      showToast('Entry removed', 'info')
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    }
  }

  function startEdit(entry) {
    setEditId(entry.entryId)
    setEditDate(entry.date)
    const known = CATEGORIES.some((c) => c.key === entry.category)
    setEditCategory(known ? entry.category : 'Other')
    setEditCustomCategory(known ? '' : entry.category)
    setEditNote(entry.note || '')
    setEditAmount(String(entry.amount))
    setConfirmDeleteId(null)
  }

  function cancelEdit() {
    setEditId(null)
  }

  async function saveEdit(entryId) {
    if (!(parseFloat(editAmount) > 0)) { showToast('Enter an amount greater than 0.', 'error'); return }
    const finalCategory = editCategory === 'Other' ? (editCustomCategory.trim() || 'Other') : editCategory
    setSavingEdit(true)
    try {
      await updateDeduction(entryId, {
        date: editDate, category: finalCategory, note: editNote, amount: parseFloat(editAmount)
      })
      setEntries((list) => list.map((e) => e.entryId === entryId
        ? { ...e, date: editDate, category: finalCategory, note: editNote, amount: parseFloat(editAmount) }
        : e))
      setEditId(null)
      showToast('Entry updated', 'success')
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  const total = useMemo(() => entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0), [entries])
  const label = MONTHS[month - 1] + '-' + year

  function downloadExcelReport() {
    downloadExcel(
      `Deductions-${label}`,
      `Advances & Deductions — ${label}`,
      ['Date', 'Employee', 'Employee ID', 'Category', 'Note', 'Amount', 'Added By'],
      entries.map((e) => [e.date, e.name, e.employeeId, e.category, e.note || '', e.amount, e.addedBy || ''])
    )
  }

  function downloadPdfReport() {
    downloadPdf(
      `Advances & Deductions — ${label}`,
      `Sridhi Ventures · Generated ${new Date().toLocaleDateString('en-IN')}`,
      ['Date', 'Employee', 'Category', 'Note', 'Amount'],
      entries.map((e) => [e.date, e.name, e.category, e.note || '—', '₹' + e.amount.toLocaleString('en-IN')]),
      [
        { label: 'Total Deductions', value: '₹' + total.toLocaleString('en-IN') },
        { label: 'Entries', value: String(entries.length) },
        { label: 'Month', value: label }
      ]
    )
  }

  return (
    <div className="space-y-4">
      {/* Add new entry */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card space-y-3">
        <p className="font-display font-semibold text-ink text-sm">Mark Advance / Deduction</p>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Employee</label>
          <EmployeePicker employees={employees} marked={{}} value={employeeId} onChange={setEmployeeId} />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Amount (₹)</label>
            <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="input" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Category</label>
          <div className="grid grid-cols-3 gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10.5px] font-semibold border transition-all ${
                  category === c.key ? 'bg-brand-500 text-white border-brand-500 shadow-soft' : 'bg-surface text-slate-500 border-brand-100'
                }`}
              >
                <span className="text-sm">{c.icon}</span>
                {c.key}
              </button>
            ))}
          </div>
          {category === 'Other' && (
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Name this deduction — e.g. Uniform, Tool damage…"
              className="input mt-2 text-sm"
            />
          )}
        </div>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional) — e.g. reason or details"
          className="input text-sm"
        />

        <button onClick={submit} disabled={submitting} className="w-full btn-primary py-3 text-sm">
          {submitting ? 'Saving…' : '+ Add Entry'}
        </button>
        <p className="text-[10px] text-slate-400 text-center">This will be deducted from the employee's Net Salary and shown on their dashboard.</p>
      </div>

      {/* Month navigator + summary */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => { if (month === 1) { setMonth(12); setYear((y) => y - 1) } else setMonth((m) => m - 1) }} className="w-8 h-8 rounded-lg bg-surface text-brand-600 font-bold">‹</button>
          <p className="font-display font-semibold text-ink text-sm">{label}</p>
          <button onClick={() => { if (month === 12) { setMonth(1); setYear((y) => y + 1) } else setMonth((m) => m + 1) }} className="w-8 h-8 rounded-lg bg-surface text-brand-600 font-bold">›</button>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-rust to-red-700 p-4 text-white">
          <p className="text-white/80 text-xs mb-1">Total Deductions · {label}</p>
          <p className="font-display font-bold text-2xl">₹{total.toLocaleString('en-IN')}</p>
          <p className="text-white/70 text-[11px] mt-1">{entries.length} entries</p>
        </div>
        {entries.length > 0 && (
          <div className="flex gap-2 mt-3">
            <button onClick={downloadPdfReport} className="flex-1 text-xs font-semibold py-2.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200">
              ⬇ PDF Report
            </button>
            <button onClick={downloadExcelReport} className="flex-1 text-xs font-semibold py-2.5 rounded-xl bg-surface text-slate-600 border border-brand-100">
              ⬇ Excel Report
            </button>
          </div>
        )}
      </div>

      {/* Entry list */}
      <div className="space-y-2">
        {loading && [1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}
        {!loading && entries.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">No deductions recorded for {label} yet.</p>
        )}
        {entries.map((e) => (
          <div key={e.entryId} className="bg-white border border-brand-50 rounded-2xl p-3 shadow-card">
            {editId === e.entryId ? (
              <div className="space-y-2.5">
                <p className="font-semibold text-xs text-ink">Editing — {e.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wide">Date</label>
                    <input type="date" value={editDate} onChange={(ev) => setEditDate(ev.target.value)} className="input text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wide">Amount (₹)</label>
                    <input type="number" min="0" value={editAmount} onChange={(ev) => setEditAmount(ev.target.value)} className="input text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wide">Category</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setEditCategory(c.key)}
                        className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[10px] font-semibold border transition-all ${
                          editCategory === c.key ? 'bg-brand-500 text-white border-brand-500 shadow-soft' : 'bg-surface text-slate-500 border-brand-100'
                        }`}
                      >
                        <span className="text-sm">{c.icon}</span>
                        {c.key}
                      </button>
                    ))}
                  </div>
                  {editCategory === 'Other' && (
                    <input
                      type="text"
                      value={editCustomCategory}
                      onChange={(ev) => setEditCustomCategory(ev.target.value)}
                      placeholder="Name this deduction…"
                      className="input mt-2 text-sm"
                    />
                  )}
                </div>
                <input
                  type="text"
                  value={editNote}
                  onChange={(ev) => setEditNote(ev.target.value)}
                  placeholder="Note (optional) — e.g. reason or details"
                  className="input text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(e.entryId)} disabled={savingEdit} className="flex-1 btn-primary py-2 text-xs">
                    {savingEdit ? 'Saving…' : '✓ Save Changes'}
                  </button>
                  <button onClick={cancelEdit} disabled={savingEdit} className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface text-slate-500 border border-brand-100">
                    Cancel
                  </button>
                </div>
              </div>
            ) : confirmDeleteId === e.entryId ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-ink">Remove <span className="font-semibold">₹{e.amount.toLocaleString('en-IN')} {e.category}</span> for {e.name}?</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => remove(e.entryId)} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-rust text-white">Delete</button>
                  <button onClick={() => setConfirmDeleteId(null)} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-surface text-slate-500 border border-brand-100">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-ink truncate">{e.name}</p>
                  <p className="text-[11px] text-slate-400">{e.date} · {categoryIconFor(e.category)} {e.category}{e.note ? ' · ' + e.note : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <p className="font-display font-bold text-rust text-sm mr-1">₹{e.amount.toLocaleString('en-IN')}</p>
                  <button onClick={() => startEdit(e)} className="text-slate-300 hover:text-brand-600 text-sm leading-none px-1.5 py-1" title="Edit">✎</button>
                  <button onClick={() => setConfirmDeleteId(e.entryId)} className="text-slate-300 hover:text-rust text-lg leading-none px-1.5 py-1" title="Delete">×</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
