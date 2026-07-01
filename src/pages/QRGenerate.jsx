import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import QRCodeDisplay from '../components/QRCodeDisplay.jsx'
import { getEmployees } from '../api/sheetApi.js'

export default function QRGenerate() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getEmployees()
      .then((d) => setEmployees(d.employees || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = employees.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.employeeId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-5 pt-6 max-w-md mx-auto">
      <TopBar
        eyebrow="ID Cards"
        title="Generate Employee QR"
        subtitle="Find any employee and download their QR code to print on the back of their ID card."
      />

      {selected ? (
        <div className="animate-popIn space-y-4">
          <QRCodeDisplay employeeId={selected.employeeId} employeeName={selected.name} />
          <button onClick={() => setSelected(null)} className="w-full bg-white border border-brand-100 rounded-xl py-3 text-sm font-medium text-slate-600">
            ← Back to employee list
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search by name or Employee ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input mb-4"
          />

          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-2xl skeleton" />
              ))}
            </div>
          )}

          <div className="space-y-2">
            {filtered.map((e, idx) => (
              <button
                key={e.employeeId}
                style={{ animationDelay: `${idx * 30}ms` }}
                onClick={() => setSelected(e)}
                className="w-full text-left bg-white border border-brand-50 rounded-2xl p-3.5 flex items-center justify-between shadow-card animate-fadeUp active:scale-[0.98] transition-transform"
              >
                <div>
                  <p className="font-medium text-sm text-ink">{e.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {e.employeeId} · <span className="capitalize">{e.type}</span>
                  </p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-brand-400">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
            ))}
            {!loading && filtered.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No employees found.</p>}
          </div>
        </>
      )}
    </div>
  )
}
