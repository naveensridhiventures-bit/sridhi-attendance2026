import { useEffect } from 'react'
import { vibrate } from '../utils/haptics.js'

// Global touch layer. Every tap, hold or drag anywhere in the app leaves a short-lived mark:
//   tap   → a ring that opens out from the fingertip, plus a few gold sparks
//   hold  → an aura that swells under the finger and pops when you let go
//   drag  → a fading trail (mouse and pen move, touch drags that don't scroll)
// Plus a soft spotlight that follows the finger across any card (.shadow-card or .spot).
// Everything is built from plain DOM nodes outside React, so a tap never re-renders anything.
// Turn it off for a device with localStorage 'sv-fx' = 'off'. Reduced-motion users get none of it.

const MAX_NODES = 36
const HOLD_MS = 380
const SPARKS = 7
const INTERACTIVE = 'button, a, [role="button"], summary, label, select, input[type="checkbox"], input[type="radio"], .tap'

function fxEnabled() {
  try {
    if (localStorage.getItem('sv-fx') === 'off') return false
  } catch (_) { /* ignore */ }
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function TouchFX() {
  useEffect(() => {
    const layer = document.createElement('div')
    layer.setAttribute('aria-hidden', 'true')
    layer.className = 'tfx-layer'
    document.body.appendChild(layer)

    let down = null // { id, x, y, type, timer, aura }
    let lastTrail = 0
    let spotEl = null
    let spotRaf = 0

    const room = () => layer.childElementCount < MAX_NODES

    function put(el, life) {
      layer.appendChild(el)
      const kill = () => el.remove()
      el.addEventListener('animationend', kill, { once: true })
      setTimeout(kill, life) // safety net if animationend never fires (tab hidden, etc.)
    }

    function ring(x, y, big = false) {
      if (!room()) return
      const el = document.createElement('span')
      el.className = big ? 'tfx-ring tfx-ring-big' : 'tfx-ring'
      el.style.left = x + 'px'
      el.style.top = y + 'px'
      put(el, 900)
    }

    function sparks(x, y, count = SPARKS, spread = 46) {
      for (let i = 0; i < count && room(); i++) {
        const a = (Math.PI * 2 * i) / count + Math.random() * 0.7
        const d = spread * (0.55 + Math.random() * 0.6)
        const el = document.createElement('span')
        el.className = i % 3 === 0 ? 'tfx-spark tfx-spark-green' : 'tfx-spark'
        el.style.left = x + 'px'
        el.style.top = y + 'px'
        el.style.setProperty('--dx', Math.cos(a) * d + 'px')
        el.style.setProperty('--dy', Math.sin(a) * d + 'px')
        el.style.setProperty('--s', (0.7 + Math.random() * 0.8).toFixed(2))
        put(el, 800)
      }
    }

    function trail(x, y) {
      if (!room()) return
      const el = document.createElement('span')
      el.className = 'tfx-trail'
      el.style.left = x + 'px'
      el.style.top = y + 'px'
      put(el, 700)
    }

    function setSpot(target, e) {
      const card = target && target.closest ? target.closest('.shadow-card, .spot') : null
      if (spotEl && spotEl !== card) spotEl.removeAttribute('data-spot')
      spotEl = card
      if (!card) return
      cancelAnimationFrame(spotRaf)
      spotRaf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', e.clientX - r.left + 'px')
        card.style.setProperty('--my', e.clientY - r.top + 'px')
        card.setAttribute('data-spot', '')
      })
    }

    function clearSpot() {
      if (spotEl) spotEl.removeAttribute('data-spot')
      spotEl = null
    }

    function endAura(pop) {
      if (!down || !down.aura) return
      const aura = down.aura
      down.aura = null
      if (pop) {
        const x = parseFloat(aura.style.left)
        const y = parseFloat(aura.style.top)
        ring(x, y, true)
        sparks(x, y, 11, 78)
        vibrate(10)
      }
      aura.classList.add('tfx-aura-out')
      setTimeout(() => aura.remove(), 360)
    }

    function onDown(e) {
      if (!fxEnabled()) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const x = e.clientX
      const y = e.clientY
      ring(x, y)
      sparks(x, y)
      setSpot(e.target, e)
      if (e.target.closest && e.target.closest(INTERACTIVE)) vibrate(6)

      down = { id: e.pointerId, x, y, type: e.pointerType, aura: null, timer: 0 }
      down.timer = setTimeout(() => {
        if (!down || down.id !== e.pointerId || !room()) return
        const aura = document.createElement('span')
        aura.className = 'tfx-aura'
        aura.style.left = down.x + 'px'
        aura.style.top = down.y + 'px'
        layer.appendChild(aura)
        down.aura = aura
        vibrate(8)
      }, HOLD_MS)
    }

    function onMove(e) {
      if (!fxEnabled()) return
      // Spotlight follows the finger or the mouse over cards
      if (down || e.pointerType === 'mouse') setSpot(e.target, e)

      if (down && down.id === e.pointerId) {
        // Moving far enough cancels the hold
        if (!down.aura && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) clearTimeout(down.timer)
        if (down.aura) {
          down.aura.style.left = e.clientX + 'px'
          down.aura.style.top = e.clientY + 'px'
          down.x = e.clientX
          down.y = e.clientY
        }
      }
      const dragging = down && down.id === e.pointerId
      if (dragging || (e.pointerType === 'mouse' && e.buttons === 0)) {
        const now = performance.now()
        if (now - lastTrail > (dragging ? 34 : 70)) {
          lastTrail = now
          trail(e.clientX, e.clientY)
        }
      }
    }

    function onUp(e) {
      if (!down || down.id !== e.pointerId) return
      clearTimeout(down.timer)
      endAura(true)
      down = null
      if (e.pointerType !== 'mouse') clearSpot()
    }

    function onCancel(e) {
      // The browser took over the gesture (a scroll). Don't pop anything.
      if (!down || down.id !== e.pointerId) return
      clearTimeout(down.timer)
      endAura(false)
      down = null
      clearSpot()
    }

    document.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('pointercancel', onCancel, { passive: true })
    document.addEventListener('pointerleave', clearSpot, { passive: true })
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onCancel)
      document.removeEventListener('pointerleave', clearSpot)
      cancelAnimationFrame(spotRaf)
      layer.remove()
    }
  }, [])

  return null
}
