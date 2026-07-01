import { useEffect, useRef, useState } from 'react'

// Returns a ref to attach to an element and a boolean that flips to true
// once the element scrolls into view — use to trigger reveal animations
// as the user scrolls, rather than only animating on initial page load.
export default function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, visible]
}
