import React, { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import TiltCard from './TiltCard.jsx'
import CircuitBorder from './CircuitBorder.jsx'
import { haptics } from '../utils/haptics.js'

// Displays an employee's QR code (encodes the Employee ID) with a download-as-PNG button
// for printing onto the back of an ID card. Wrapped in a 3D tilt + animated circuit border.
export default function QRCodeDisplay({ employeeId, employeeName, size = 220 }) {
  const wrapRef = useRef(null)

  const handleDownload = () => {
    const canvas = wrapRef.current?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${employeeId}_QR.png`
    a.click()
    haptics.success()
  }

  if (!employeeId) return null

  return (
    <CircuitBorder radius={24} className="rounded-3xl">
      <TiltCard className="rounded-3xl">
        <div className="flex flex-col items-center gap-3 bg-white rounded-3xl p-6 border border-brand-100 shadow-soft animate-popIn">
          <img src="/logo.png" alt="Sridhi" className="w-9 h-9 object-contain mb-1" />
          <div ref={wrapRef} className="bg-white p-3 rounded-2xl border-2 border-brand-100">
            <QRCodeCanvas value={employeeId} size={size} level="H" includeMargin={false} fgColor="#0F6630" />
          </div>
          <div className="text-center">
            <p className="font-display font-semibold text-ink">{employeeName}</p>
            <p className="text-xs text-brand-500 font-medium tracking-widest mt-0.5">{employeeId}</p>
          </div>
          <button onClick={handleDownload} className="w-full btn-primary py-2.5 text-sm">
            Download QR (for ID card)
          </button>
        </div>
      </TiltCard>
    </CircuitBorder>
  )
}
