import { useEffect } from 'react'

// One document-level listener that gives every tappable thing an ink ripple that starts under the finger.
// The ripple lives in its own clipping layer inside the element, so badges and other children
// that overhang the edge are never cut off. The ink colour follows the surface: white on dark or
// coloured surfaces, brand green on light ones.
const TARGETS = 'button, a[href], [role="button"], summary, .btn-primary, .ripple, .tap'

const luminance = (r, g, b) => (r * 299 + g * 587 + b * 114) / 1000

// First clearly visible colour in a CSS colour list ("rgb(..)", "rgba(..)"), or null
function firstSolidColor(text) {
  const re = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/g
  let m
  while ((m = re.exec(text))) {
    const a = m[4] === undefined ? 1 : parseFloat(m[4])
    if (a >= 0.5) return luminance(+m[1], +m[2], +m[3])
  }
  return null
}

// Walk up to the first visibly painted surface and report whether it is light
function surfaceIsLight(el) {
  for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
    const cs = getComputedStyle(node)
    if (cs.backgroundImage && cs.backgroundImage !== 'none') {
      const l = firstSolidColor(cs.backgroundImage)
      if (l !== null) return l > 150
    }
    const l = firstSolidColor(cs.backgroundColor)
    if (l !== null) return l > 150
  }
  return true
}

export default function useGlobalRipple() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')

    function handlePointerDown(e) {
      if (reduce.matches) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const target = e.target.closest(TARGETS)
      if (!target || target.disabled || target.hasAttribute('data-no-ripple')) return
      const cs = getComputedStyle(target)
      if (cs.display === 'inline') return // plain text links: nothing to clip to

      const rect = target.getBoundingClientRect()
      if (rect.width < 8 || rect.height < 8) return
      if (cs.position === 'static') target.style.position = 'relative'

      const host = document.createElement('span')
      host.className = 'ripple-host'
      host.style.borderRadius = cs.borderRadius

      const size = Math.hypot(rect.width, rect.height) * 2
      const dot = document.createElement('span')
      dot.className = 'ripple-dot' + (surfaceIsLight(target) ? ' ripple-dot-ink' : '')
      dot.style.width = dot.style.height = `${size}px`
      dot.style.left = `${e.clientX - rect.left - size / 2}px`
      dot.style.top = `${e.clientY - rect.top - size / 2}px`

      host.appendChild(dot)
      target.appendChild(host)
      const done = () => host.remove()
      dot.addEventListener('animationend', done, { once: true })
      setTimeout(done, 1000)
    }

    document.addEventListener('pointerdown', handlePointerDown, { passive: true })
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])
}
