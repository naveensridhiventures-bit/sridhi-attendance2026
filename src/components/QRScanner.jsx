import React, { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

// Reusable camera QR scanner. Calls onScan(decodedText) once per successful scan,
// then pauses briefly to avoid duplicate triggers.
export default function QRScanner({ onScan, paused }) {
  const containerId = 'qr-reader-' + Math.random().toString(36).slice(2)
  const scannerRef = useRef(null)
  const lastScanRef = useRef({ text: '', time: 0 })

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(containerId)
    scannerRef.current = html5QrCode

    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          const now = Date.now()
          if (decodedText === lastScanRef.current.text && now - lastScanRef.current.time < 3000) {
            return // ignore duplicate rapid scans of same code
          }
          lastScanRef.current = { text: decodedText, time: now }
          onScan(decodedText)
        },
        () => {} // ignore per-frame scan errors (no QR in view)
      )
      .catch((err) => {
        console.error('Unable to start camera', err)
      })

    return () => {
      html5QrCode
        .stop()
        .then(() => html5QrCode.clear())
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative">
      <div id={containerId} className="rounded-3xl overflow-hidden border-2 border-brand-300 aspect-square shadow-soft" />
      {paused && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-3xl">
          <span className="text-brand-600 font-display font-semibold animate-pulse">Processing…</span>
        </div>
      )}
    </div>
  )
}
