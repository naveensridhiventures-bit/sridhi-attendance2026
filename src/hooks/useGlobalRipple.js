import { useEffect } from 'react'

// Attaches a single document-level listener that injects a material-style
// ripple span into any element with the `.btn-primary` or `.ripple` class
// on pointerdown — no need to wrap every button individually.
export default function useGlobalRipple() {
  useEffect(() => {
    function handlePointerDown(e) {
      const target = e.target.closest('.btn-primary, .ripple')
      if (!target) return
      const rect = target.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 1.6
      const span = document.createElement('span')
      span.className = 'ripple-dot'
      span.style.width = span.style.height = `${size}px`
      span.style.left = `${e.clientX - rect.left - size / 2}px`
      span.style.top = `${e.clientY - rect.top - size / 2}px`
      if (getComputedStyle(target).position === 'static') {
        target.style.position = 'relative'
      }
      target.style.overflow = 'hidden'
      target.appendChild(span)
      span.addEventListener('animationend', () => span.remove())
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])
}
