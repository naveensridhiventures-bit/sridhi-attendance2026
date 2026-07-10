// src/utils/attendanceStatus.js
// Single source of truth for attendance status colors/labels so the
// dropdown, bulk picker, and status buttons all stay visually consistent.

export const STATUS_OPTIONS = [
  { key: 'present', label: 'P',   full: 'Present',        color: 'from-brand-400 to-brand-600', dot: 'bg-brand-500',  soft: 'bg-brand-50 text-brand-700 border-brand-200' },
  { key: 'absent',  label: 'A',   full: 'Absent',          color: 'from-rust to-red-700',        dot: 'bg-rust',       soft: 'bg-rust/10 text-rust border-rust/30' },
  { key: 'weekoff', label: 'WO',  full: 'Week Off',        color: 'from-gold-400 to-gold-500',   dot: 'bg-gold-500',   soft: 'bg-gold-50 text-gold-700 border-gold-200' },
  { key: 'wop',     label: 'WOP', full: 'Worked on WO',    color: 'from-sky-400 to-sky-600',     dot: 'bg-sky-500',    soft: 'bg-sky-50 text-sky-700 border-sky-200' },
  { key: 'na',      label: 'NA',  full: 'Not Available',   color: 'from-slate-400 to-slate-500', dot: 'bg-slate-400',  soft: 'bg-slate-100 text-slate-600 border-slate-200' }
]

const UNMARKED = { key: '', label: '', full: 'Not marked', color: 'from-slate-200 to-slate-300', dot: 'bg-slate-300', soft: 'bg-white text-slate-400 border-brand-100' }

export function getStatusMeta(statusKey) {
  if (!statusKey) return UNMARKED
  const norm = String(statusKey).toLowerCase()
  return STATUS_OPTIONS.find((s) => s.key === norm || s.label.toLowerCase() === norm) || UNMARKED
}
