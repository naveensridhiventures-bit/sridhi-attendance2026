import React from 'react'

// Icon + accent per deduction category — keep in sync with DeductionsManager's CATEGORIES.
const CATEGORY_META = {
  'Advance':      { icon: '💵' },
  'Penalty':      { icon: '⚠️' },
  'Gas Expense':  { icon: '🔥' },
  'Food Expense': { icon: '🍽️' },
  'Rice Cost':    { icon: '🍚' },
  'Other':        { icon: '📝' }
}

function categoryIcon(cat) {
  return CATEGORY_META[cat]?.icon || '📝'
}

function inr(n) {
  return '₹' + (parseFloat(n) || 0).toLocaleString('en-IN')
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/**
 * Payslip-style breakdown:
 *   Earned Salary            ₹12,000
 *   – Advance                 ₹1,000
 *   – Gas Expense                ₹199
 *   – Rice Cost                ₹1,200
 *   ───────────────────────────────
 *   Net Salary (Take-home)    ₹9,601
 *
 * Used on the Employee dashboard (their own salary) and on the HR salary
 * sheet (per-employee expand) so both sides see the exact same, easy to
 * read math for how the final number was arrived at.
 */
export default function SalaryPayslip({ earnedSalary = 0, deductions = [], finalSalary = 0, compact = false }) {
  const totalDeductions = deductions.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)
  const runningFallback = Math.max(earnedSalary - totalDeductions, 0)
  const net = finalSalary || runningFallback

  return (
    <div className={`rounded-2xl border border-brand-100 bg-white ${compact ? 'p-3' : 'p-4'} overflow-hidden`}>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2 px-0.5">Salary Breakdown</p>

      <div className="space-y-1.5">
        {/* Starting point */}
        <div className="flex items-center justify-between py-1.5 px-1">
          <span className="text-sm font-medium text-ink flex items-center gap-1.5">
            <span className="text-base">📄</span> Earned Salary
          </span>
          <span className="font-display font-bold text-ink text-sm">{inr(earnedSalary)}</span>
        </div>

        {/* Each deduction line, subtracted one by one */}
        {deductions.map((d) => (
          <div key={d.entryId || `${d.category}-${d.date}-${d.amount}`} className="py-1.5 px-1 border-t border-dashed border-brand-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-1.5 min-w-0">
                <span className="text-base shrink-0">{categoryIcon(d.category)}</span>
                <span className="truncate">
                  <span className="text-rust font-semibold">− </span>
                  {d.category}
                </span>
              </span>
              <span className="font-semibold text-rust text-sm shrink-0 ml-2">− {inr(d.amount)}</span>
            </div>
            {(d.date || d.note) && (
              <p className="text-[10px] text-slate-400 pl-6 mt-0.5 truncate">
                {d.date && <span className="inline-flex items-center gap-0.5">📅 {formatDate(d.date)}</span>}
                {d.date && d.note ? ' · ' : ''}
                {d.note}
              </p>
            )}
          </div>
        ))}

        {deductions.length === 0 && (
          <div className="py-1.5 px-1 border-t border-dashed border-brand-50">
            <span className="text-xs text-slate-400 italic">No advances or deductions this month 🎉</span>
          </div>
        )}

        {/* Total line */}
        <div className="flex items-center justify-between pt-2.5 mt-1 border-t-2 border-brand-200">
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <span className="text-base">✅</span> Net Salary <span className="font-normal text-slate-400 text-[11px]">(Take-home)</span>
          </span>
          <span className="font-display font-extrabold text-brand-700 text-lg">{inr(net)}</span>
        </div>
      </div>

      {deductions.length > 0 && (
        <div className="mt-3 rounded-xl bg-surface px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Total deducted</span>
          <span className="text-[11px] font-bold text-rust">− {inr(totalDeductions)}</span>
        </div>
      )}
    </div>
  )
}
