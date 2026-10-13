import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

// Route transitions with a sense of direction. The page you leave slides and blurs away, the new one
// arrives from the side you are heading towards (tabs are ordered Home → Attendance → QR → Dashboard),
// and a route that isn't a tab (add employee, a login) rises from below. Cards then settle in one by one.
const EXIT_MS = 190
const TAB_ORDER = ['/', '/attendance', '/qr-codes', '/dashboard-login']
const DASH = ['/dashboard-login', '/employee-login', '/hr-login', '/employee-dashboard', '/hr-dashboard']

function slot(path) {
  if (path === '/') return 0
  if (path.startsWith('/attendance')) return 1
  if (path.startsWith('/qr-codes')) return 2
  if (DASH.some((d) => path.startsWith(d))) return 3
  return -1
}

function direction(from, to) {
  const a = slot(from)
  const b = slot(to)
  if (a < 0 || b < 0) return 'up'
  if (a === b) return to.length > from.length ? 'fwd' : 'back' // e.g. login → dashboard goes deeper
  return b > a ? 'fwd' : 'back'
}

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Gives the cards on a freshly opened page a staggered entrance, and any card that shows up later
// (after data loads) a quick one of its own.
function useCardEntrance(rootRef, pageKey) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reduceMotion()) return undefined

    const eligible = (el) =>
      !el.classList.contains('rise') &&
      !el.classList.contains('card-in') &&
      !/\banimate-/.test(el.className) &&
      !el.parentElement.closest('.shadow-card')

    function animate(el, n) {
      el.style.setProperty('--n', n)
      el.classList.add('card-in')
      const done = () => { el.classList.remove('card-in'); el.style.removeProperty('--n') }
      el.addEventListener('animationend', done, { once: true })
      setTimeout(done, 1400)
    }

    let n = 0
    root.querySelectorAll('.shadow-card').forEach((el) => {
      if (!eligible(el)) return
      const top = el.getBoundingClientRect().top
      if (top < window.innerHeight * 1.2 && n < 12) animate(el, n++)
    })

    const mo = new MutationObserver((records) => {
      records.forEach((r) =>
        r.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return
          const cards = node.matches?.('.shadow-card') ? [node] : [...node.querySelectorAll?.('.shadow-card') || []]
          cards.forEach((el, i) => { if (eligible(el)) animate(el, Math.min(i, 6)) })
        })
      )
    })
    mo.observe(root, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [rootRef, pageKey])
}

export default function PageTransition({ render, scrollRef }) {
  const location = useLocation()
  const [shown, setShown] = useState(location)
  const [phase, setPhase] = useState('in')
  const dirRef = useRef('up')
  const hostRef = useRef(null)

  useEffect(() => {
    if (location.pathname === shown.pathname) {
      if (location !== shown) setShown(location) // same page, new query or state
      return undefined
    }
    dirRef.current = direction(shown.pathname, location.pathname)
    if (reduceMotion()) {
      setShown(location)
      return undefined
    }
    setPhase('out')
    const t = setTimeout(() => {
      setShown(location)
      setPhase('in')
      if (scrollRef?.current) scrollRef.current.scrollTop = 0
      window.scrollTo(0, 0)
    }, EXIT_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  useCardEntrance(hostRef, shown.pathname)

  return (
    <div
      ref={hostRef}
      key={shown.pathname}
      data-page={shown.pathname}
      className={`pt pt-${phase} pt-${dirRef.current}`}
      style={{ pointerEvents: phase === 'out' ? 'none' : undefined }}
    >
      {render(shown)}
    </div>
  )
}

export { TAB_ORDER }
