import React, { useEffect, useState } from 'react'

// Shows a native-style install banner as soon as the app opens (not installed yet).
// Uses the native beforeinstallprompt on Android/Desktop Chrome when available,
// and falls back to clear manual instructions on iOS Safari or when the browser
// hasn't fired beforeinstallprompt yet (it has its own engagement heuristics).
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [platform, setPlatform] = useState('other') // 'ios' | 'android' | 'other'
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('sv-install-dismissed') === '1')

  useEffect(() => {
    // Don't show if already installed (running as standalone PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (isStandalone) return
    if (dismissed) return

    const ua = navigator.userAgent
    const ios = /iphone|ipad|ipod/i.test(ua)
    const android = /android/i.test(ua)
    setPlatform(ios ? 'ios' : android ? 'android' : 'other')

    // Show the banner right away on open — don't wait for the browser's
    // own install-prompt heuristics, which can take multiple visits to fire.
    const showTimer = setTimeout(() => setShowBanner(true), 1200)

    // If the browser does offer the native prompt, capture it so the
    // Install button can trigger the real one-tap install dialog.
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => {
      setShowBanner(false)
      sessionStorage.setItem('sv-install-dismissed', '1')
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      clearTimeout(showTimer)
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [dismissed])

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      if (choice.outcome === 'accepted') setShowBanner(false)
      return
    }
    // No native prompt captured yet — reveal manual steps instead of doing nothing.
    setPlatform((p) => (p === 'other' ? 'android' : p))
  }

  function handleDismiss() {
    setShowBanner(false)
    setDismissed(true)
    sessionStorage.setItem('sv-install-dismissed', '1')
  }

  if (!showBanner || dismissed) return null

  const hasNativePrompt = !!deferredPrompt

  return (
    <div className="fixed bottom-28 inset-x-0 z-50 px-4 animate-toastIn">
      <div className="max-w-md mx-auto bg-ink rounded-3xl p-4 shadow-2xl border border-brand-600/30 flex items-center gap-3">
        <img src="/icons/icon-192-v2.png" alt="Sridhi" className="w-14 h-14 rounded-2xl shrink-0 shadow-lg" />

        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-white text-sm">Install Sridhi Attendance</p>
          {platform === 'ios' ? (
            <p className="text-slate-400 text-[11px] mt-0.5">
              Tap <span className="text-brand-400">Share</span> → <span className="text-brand-400">Add to Home Screen</span>
            </p>
          ) : hasNativePrompt ? (
            <p className="text-slate-400 text-[11px] mt-0.5">
              Install as an app — works offline, opens instantly
            </p>
          ) : (
            <p className="text-slate-400 text-[11px] mt-0.5">
              Tap <span className="text-brand-400">⋮ Menu</span> → <span className="text-brand-400">Install app / Add to Home screen</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {platform !== 'ios' && (
            <button
              onClick={handleInstall}
              className="bg-brand-500 text-white text-xs font-bold rounded-xl px-3.5 py-2 shadow-soft"
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-slate-500 text-[11px] text-center"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
