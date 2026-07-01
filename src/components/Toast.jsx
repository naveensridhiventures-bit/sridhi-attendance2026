import React, { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-28 inset-x-0 z-[60] flex flex-col items-center gap-2 px-5 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-md w-full pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-soft text-sm font-medium animate-toastIn ${
              t.type === 'success'
                ? 'bg-ink text-white border border-brand-500/40'
                : t.type === 'error'
                ? 'bg-rust text-white'
                : 'bg-ink text-white border border-gold-500/40'
            }`}
          >
            <span className={t.type === 'success' ? 'text-brand-400' : t.type === 'error' ? 'text-white' : 'text-gold-400'}>
              {t.type === 'success' ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" className="animate-checkDraw" />
                </svg>
              ) : t.type === 'error' ? (
                '✕'
              ) : (
                'ℹ'
              )}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Safe no-op fallback if used outside provider
    return () => {}
  }
  return ctx
}
