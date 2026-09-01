// src/utils/attendanceStatus.js
// Single source of truth for attendance status colors/labels so the
// dropdown, bulk picker, and status buttons all stay visually consistent.

export const STATUS_OPTIONS = [
  { key: 'present', label: 'P',   full: 'Present',        color: 'from-emerald-400 to-emerald-600', dot: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'absent',  label: 'A',   full: 'Absent',          color: 'from-red-400 to-red-600',         dot: 'bg-red-500',     soft: 'bg-red-50 text-red-700 border-red-200' },
  { key: 'weekoff', label: 'WO',  full: 'Week Off',        color: 'from-yellow-300 to-yellow-500',   dot: 'bg-yellow-400',  soft: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { key: 'wop',     label: 'WOP', full: 'Worked on WO',    color: 'from-purple-400 to-purple-600',   dot: 'bg-purple-600',  soft: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'na',      label: 'NA',  full: 'Not Available',   color: 'from-blue-400 to-blue-600',       dot: 'bg-blue-600',    soft: 'bg-blue-50 text-blue-700 border-blue-200' }
]

const UNMARKED = { key: '', label: '', full: 'Not marked', color: 'from-slate-200 to-slate-300', dot: 'bg-slate-300', soft: 'bg-white text-slate-400 border-brand-100' }

export function getStatusMeta(statusKey) {
  if (!statusKey) return UNMARKED
  const norm = String(statusKey).toLowerCase()
  return STATUS_OPTIONS.find((s) => s.key === norm || s.label.toLowerCase() === norm) || UNMARKED
}
