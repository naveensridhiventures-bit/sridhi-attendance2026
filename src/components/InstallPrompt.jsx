import React, { useEffect, useState } from 'react'

// Shows a native-style install banner when the PWA is installable.
// Handles both Android (beforeinstallprompt) and iOS (manual Add to Home Screen guide).
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('sv-install-dismissed') === '1')

  useEffect(() => {
    // Don't show if already installed (running as standalone PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (dismissed) return

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    if (ios) {
      // iOS doesn't support beforeinstallprompt — show manual guide
      setTimeout(() => setShowBanner(true), 2000)
      return
    }

    // Android / Chrome — intercept the install prompt
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [dismissed])

  function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null)
        setShowBanner(false)
      })
    }
  }

  function handleDismiss() {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem('sv-install-dismissed', '1')
  }

  if (!showBanner || dismissed) return null

  return (
    <div className="fixed bottom-28 inset-x-0 z-50 px-4 animate-toastIn">
      <div className="max-w-md mx-auto bg-ink rounded-3xl p-4 shadow-2xl border border-brand-600/30 flex items-center gap-3">
        {/* App icon */}
        <img src="/icons/icon-192.png" alt="Sridhi" className="w-14 h-14 rounded-2xl shrink-0 shadow-lg" />

        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-white text-sm">Install Sridhi Attendance</p>
          {isIOS ? (
            <p className="text-slate-400 text-[11px] mt-0.5">
              Tap <span className="text-brand-400">Share</span> → <span className="text-brand-400">Add to Home Screen</span>
            </p>
          ) : (
            <p className="text-slate-400 text-[11px] mt-0.5">
              Install as an app — works offline, opens instantly
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {!isIOS && (
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
