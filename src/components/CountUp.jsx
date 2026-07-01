import React, { useEffect, useRef, useState } from 'react'

export default function CountUp({ value, duration = 800, className = '' }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)
  const fromRef = useRef(0)

  useEffect(() => {
    const target = Number(value) || 0
    const from = fromRef.current
    startRef.current = null

    let raf
    function step(ts) {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      const current = Math.round(from + (target - from) * eased)
      setDisplay(current)
      if (progress < 1) {
        raf = requestAnimationFrame(step)
      } else {
        fromRef.current = target
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <span className={className}>{display}</span>
}
