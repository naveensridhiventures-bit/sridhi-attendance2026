import React, { useEffect, useState } from 'react'
import { getMonthlySalary, getMonthlyTabsList } from '../api/sheetApi.js'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function MonthlySalaryView() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [availableMonths, setAvailableMonths] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    getMonthlyTabsList().then(r => setAvailableMonths(r.months || [])).catch(() => {})
  }, [])

  useEffect(() => { load() }, [year, month])

  async function load() {
    setLoading(true)
    try {
      const res = await getMonthlySalary(year, month)
      setRows(res.rows || [])
    } catch (_) { setRows([]) }
    finally { setLoading(false) }
  }

  const label = MONTHS[month - 1] + '-' + year
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const filtered = rows.filter(r =>
    (r.Name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.EmployeeID || '').toLowerCase().includes(search.toLowerCase())
  )
  const totalPayroll = filtered.reduce((s, r) => s + (parseFloat(r.FinalSalary) || 0), 0)

  return (
    <div className="space-y-4">
      {/* Month navigator */}
      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => { if (month === 1) { setMonth(12); setYear(y => y-1) } else setMonth(m => m-1) }}
            className="w-9 h-9 rounded-xl bg-surface text-brand-600 font-bold flex items-center justify-center"
          >‹</button>
          <div className="text-center">
            <p className="font-display font-bold text-ink">{MONTHS[month-1]} {year}</p>
            <p className="text-[11px] text-slate-400">Salary Sheet</p>
          </div>
          <button
            onClick={() => { if (month === 12) { setMonth(1); setYear(y => y+1) } else setMonth(m => m+1) }}
            className="w-9 h-9 rounded-xl bg-surface text-brand-600 font-bold flex items-center justify-center"
          >›</button>
        </div>

        {/* Available months chips */}
        {availableMonths.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {availableMonths.map(m => {
              const [mon, yr] = m.split('-')
              const mi = MONTHS.indexOf(mon) + 1
              const yi = parseInt(yr)
              const active = mi === month && yi === year
              return (
                <button
                  key={m}
                  onClick={() => { setMonth(mi); setYear(yi) }}
                  className={`text-[11px] px-3 py-1 rounded-full font-semibold border transition-all ${
                    active ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-slate-500 border-brand-100'
                  }`}
                >
                  {m}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Payroll total card */}
      {!loading && rows.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 cell-pattern shadow-soft">
          <p className="text-brand-100 text-xs mb-1">Total Payroll · {label}</p>
          <p className="font-display font-bold text-white text-2xl">₹{totalPayroll.toLocaleString('en-IN')}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-brand-200 text-[11px]">{filtered.length} employees</p>
            {isCurrentMonth && (
              <p className="text-brand-200 text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                Live · updates as attendance is marked
              </p>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or ID…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input"
      />

      {loading && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl skeleton" />)}</div>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-sm">
          <p className="text-3xl mb-2">📭</p>
          No salary data for {label} yet.<br />Data appears after attendance is marked.
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((r, i) => (
          <div key={i} className="bg-white border border-brand-50 rounded-2xl p-3.5 shadow-card animate-fadeUp" style={{ animationDelay: `${i*25}ms` }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-sm text-ink flex items-center gap-1.5">
                  {r.Name}
                  {r.Warning === 'EXCESS ABSENT' && (
                    <span className="text-[9px] font-semibold text-rust bg-rust/10 px-1.5 py-0.5 rounded-full">⚠ Excess Absent</span>
                  )}
                </p>
                <p className="text-[11px] text-slate-400">{r.EmployeeID} · <span className="capitalize">{r.Type}</span></p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-brand-600 text-base">₹{parseFloat(r.FinalSalary||0).toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-400">Final salary</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1 text-center">
              {[
                { label:'Present', value:r.Present, color:'text-brand-600' },
                { label:'Absent',  value:r.Absent,  color:'text-rust' },
                { label:'WO',      value:r.WeekOff, color:'text-gold-500' },
                { label:'WOP',     value:r.WOP,     color:'text-sky-500' },
                { label:'NA',      value:r.NA,      color:'text-slate-400' }
              ].map(s => (
                <div key={s.label} className="bg-surface rounded-xl py-1.5">
                  <p className={`font-bold text-sm ${s.color}`}>{s.value || 0}</p>
                  <p className="text-[9px] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
              <span>Base: ₹{parseFloat(r.MonthlySalary||0).toLocaleString('en-IN')}</span>
              <span>Earned: ₹{parseFloat(r.EarnedSalary||0).toLocaleString('en-IN')}</span>
              <span className="text-rust">Deduction: ₹{parseFloat(r.Deduction||0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
