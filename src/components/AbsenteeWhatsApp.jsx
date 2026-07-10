import React, { useEffect, useState } from 'react'
import { getAbsenteesToday, getHrWhatsappNumber, setHrWhatsappNumber } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'

function buildMessage(date, absentees) {
  const lines = absentees.map(
    (a) => `• ${a.name} (${a.employeeId}) — ${a.statusLabel}`
  )
  return (
    `🔔 *Attendance Alert* — ${date}\n\n` +
    `${absentees.length} not present today:\n` +
    lines.join('\n') +
    `\n\nSent from Sridhi Attendance`
  )
}

function cleanNumber(raw) {
  // wa.me needs digits only, with country code, no + or spaces
  return String(raw || '').replace(/[^\d]/g, '')
}

export default function AbsenteeWhatsApp() {
  const showToast = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ date: '', absentees: [], count: 0 })
  const [hrNumber, setHrNumberState] = useState('')
  const [editingNumber, setEditingNumber] = useState(false)
  const [numberInput, setNumberInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [absRes, numRes] = await Promise.all([getAbsenteesToday(), getHrWhatsappNumber()])
      setData(absRes)
      setHrNumberState(numRes.number || '')
      setNumberInput(numRes.number || '')
      if (!numRes.number) setEditingNumber(true)
    } catch (e) {
      showToast('Failed to load absentees: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function saveNumber() {
    const digits = cleanNumber(numberInput)
    if (digits.length < 10) {
      showToast('Enter a valid number with country code (e.g. 91XXXXXXXXXX)', 'error')
      return
    }
    setSaving(true)
    try {
      await setHrWhatsappNumber(digits)
      setHrNumberState(digits)
      setEditingNumber(false)
      showToast('HR WhatsApp number saved', 'success')
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  function sendAlert() {
    if (!hrNumber) {
      showToast('Set HR WhatsApp number first', 'error')
      setEditingNumber(true)
      return
    }
    if (data.absentees.length === 0) return
    const text = encodeURIComponent(buildMessage(data.date, data.absentees))
    window.open(`https://wa.me/${hrNumber}?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* HR WhatsApp number */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card">
        <p className="font-display font-semibold text-ink text-sm mb-2">HR WhatsApp Number</p>
        {editingNumber ? (
          <div className="flex items-center gap-1.5">
            <input
              type="tel"
              placeholder="e.g. 91XXXXXXXXXX"
              value={numberInput}
              onChange={(e) => setNumberInput(e.target.value)}
              className="input py-2 text-xs flex-1"
            />
            <button
              onClick={saveNumber}
              disabled={saving}
              className="bg-brand-500 text-white text-xs font-semibold rounded-lg px-3 py-2 shrink-0"
            >
              {saving ? '…' : 'Save'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">+{hrNumber}</p>
            <button
              onClick={() => setEditingNumber(true)}
              className="text-[11px] text-brand-600 font-semibold"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Absentee list */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-semibold text-ink text-sm">
            Today's Absentees {!loading && `(${data.count})`}
          </p>
          <button onClick={loadAll} className="text-[11px] text-slate-400">
            ↻ Refresh
          </button>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded-xl skeleton" />
            ))}
          </div>
        )}

        {!loading && data.absentees.length === 0 && (
          <p className="text-slate-400 text-xs text-center py-6">Everyone's checked in today 🎉</p>
        )}

        {!loading && data.absentees.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.absentees.map((a) => (
              <div key={a.employeeId} className="flex items-center justify-between bg-surface rounded-xl px-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-medium text-xs text-ink truncate">{a.name}</p>
                  <p className="text-[10px] text-slate-400">{a.employeeId} · {a.type}</p>
                </div>
                <span
                  className={`text-[9px] font-semibold rounded-full px-2 py-0.5 shrink-0 ${
                    a.status === 'A' ? 'bg-rust/10 text-rust' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {a.statusLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && data.absentees.length > 0 && (
        <button onClick={sendAlert} className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2">
          <span>📲</span> Send WhatsApp Alert to HR
        </button>
      )}
    </div>
  )
}
