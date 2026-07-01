import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTodaySummary } from '../api/sheetApi.js'
import MarqueeBanner from '../components/MarqueeBanner.jsx'
import DragonFly from '../components/DragonFly.jsx'
import EnergyParticles from '../components/EnergyParticles.jsx'
import EnergyGauge from '../components/EnergyGauge.jsx'
import DarkModeToggle from '../components/DarkModeToggle.jsx'
import CountUp from '../components/CountUp.jsx'
import DonutChart from '../components/DonutChart.jsx'
import Footer from '../components/Footer.jsx'
import AnnouncementBanner from '../components/AnnouncementBanner.jsx'
import useScrollReveal from '../hooks/useScrollReveal.js'

export default function Home() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getTodaySummary()
      setSummary(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="aurora-bg rounded-b-[2rem] px-5 pt-8 pb-10 shadow-soft relative overflow-hidden">
        <EnergyParticles />
        <DragonFly size={480} top="-10%" duration={24} />
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -left-6 bottom-0 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative max-w-md mx-auto animate-fadeUp">
          <div className="flex items-center gap-3 mb-3">
            <img src="/logo.png" alt="Sridhi" className="w-12 h-12 rounded-2xl bg-white object-contain p-1.5 shadow-lg animate-breatheGlow" />
            <div className="min-w-0">
              <p className="text-white font-display font-bold text-base leading-tight">Sridhi Battery Co.</p>
              <p className="text-brand-100 text-[11px]">Attendance & Workforce Management</p>
            </div>
            <DarkModeToggle className="ml-auto" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
            <span className="text-brand-50 text-[11px] font-semibold tracking-widest uppercase">Live System</span>
          </div>
          <p className="text-brand-50 text-sm">{todayStr}</p>
          <h1 className="font-display text-2xl font-bold text-shimmer mt-1">Welcome back</h1>

          {summary && (
            <div className="mt-5">
              <EnergyGauge
                percent={
                  summary.officeTotal + summary.productionTotal > 0
                    ? Math.round(((summary.officePresent + summary.productionPresent) / (summary.officeTotal + summary.productionTotal)) * 100)
                    : 0
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="px-5 -mt-6 max-w-md mx-auto relative z-10">
        <AnnouncementBanner />
        <MarqueeBanner
          items={[
            'Mark your attendance daily before 10:00 AM',
            'Use the QR Codes tab to download your ID card QR',
            'Apply for leave from your Employee Dashboard',
            'Production staff attendance is supervisor-marked'
          ]}
        />

        {loading && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl skeleton" />
            ))}
          </div>
        )}
        {error && <p className="text-rust text-sm mb-4">{error}</p>}

        {summary && (
          <>
            <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card mb-3 flex items-center gap-4 cell-pattern animate-fadeUp">
              <DonutChart
                size={92}
                strokeWidth={11}
                centerLabel={summary.officePresent + summary.productionPresent}
                centerSub="present"
                segments={[
                  { value: summary.officePresent || 0, color: '#1F9D4C' },
                  { value: summary.productionPresent || 0, color: '#E8A317' },
                  { value: Math.max(summary.officeTotal + summary.productionTotal - summary.officePresent - summary.productionPresent, 0.0001), color: '#E2E8F0' }
                ]}
              />
              <div className="flex-1 space-y-1.5">
                <Legend color="bg-brand-500" label="Office Present" value={summary.officePresent} />
                <Legend color="bg-gold-500" label="Production Present" value={summary.productionPresent} />
                <Legend color="bg-slate-300" label="Not Marked Yet" value={Math.max(summary.officeTotal + summary.productionTotal - summary.officePresent - summary.productionPresent, 0)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard label="Office Present" value={summary.officePresent} total={summary.officeTotal} accent="text-brand-600" bar="bg-brand-500" delay={0} />
              <StatCard label="Office Absent" value={summary.officeAbsent} total={summary.officeTotal} accent="text-rust" bar="bg-rust" delay={60} />
              <StatCard label="Production Present" value={summary.productionPresent} total={summary.productionTotal} accent="text-brand-600" bar="bg-brand-500" delay={120} />
              <StatCard label="Production Absent" value={summary.productionAbsent} total={summary.productionTotal} accent="text-rust" bar="bg-rust" delay={180} />
            </div>
          </>
        )}

        <div className="grid gap-3 pb-2">
          <QuickLink to="/attendance" title="Mark Attendance" desc="List marking with P / WO / NA, or QR self check-in" color="from-brand-500 to-brand-600" />
          <QuickLink to="/qr-codes" title="Generate QR Code" desc="Download any employee's ID-card QR" color="from-gold-500 to-gold-400" />
          <QuickLink to="/add-employee" title="Add New Employee" desc="Auto-generates Employee ID, password & QR" color="from-brand-600 to-brand-800" />
          <QuickLink to="/employee-login" title="Employee Dashboard" desc="Your monthly attendance, leave & QR" color="from-brand-600 to-brand-800" />
          <QuickLink to="/hr-login" title="HR / Admin Dashboard" desc="Salary management & leave approvals" color="from-ink to-brand-800" />
        </div>

        <Footer />
      </div>
    </div>
  )
}

function Legend({ color, label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-slate-500">
        <span className={`w-2 h-2 rounded-sm ${color}`} />
        {label}
      </span>
      <span className="font-semibold text-ink">
        <CountUp value={value} />
      </span>
    </div>
  )
}

function StatCard({ label, value, total, accent, bar, delay }) {
  const pct = total ? Math.min(100, Math.round(((value || 0) / total) * 100)) : 0
  return (
    <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card animate-fadeUp cell-pattern" style={{ animationDelay: `${delay}ms` }}>
      <p className={`text-2xl font-display font-bold ${accent}`}>
        <CountUp value={value ?? 0} />
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {total != null && (
        <>
          <div className="h-1.5 bg-surface rounded-full mt-2.5 overflow-hidden">
            <div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">of {total} total</p>
        </>
      )}
    </div>
  )
}

function QuickLink({ to, title, desc, color }) {
  const [ref, visible] = useScrollReveal()
  return (
    <Link
      ref={ref}
      to={to}
      className={`group flex items-center gap-4 bg-white border border-brand-50 rounded-2xl p-4 shadow-card active:scale-[0.98] transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-display font-bold`}>
        {title.charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="font-display font-semibold text-ink text-sm">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <span className="ml-auto text-brand-400 group-active:translate-x-0.5 transition-transform">-&gt;</span>
    </Link>
  )
}
