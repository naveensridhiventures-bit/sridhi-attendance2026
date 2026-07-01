// Lightweight haptic feedback helper. Silently no-ops on devices/browsers
// without the Vibration API (e.g. iOS Safari) — never throws.
export function vibrate(pattern = 15) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern)
  } catch (e) {
    // ignore
  }
}

export const haptics = {
  tap: () => vibrate(12),
  success: () => vibrate([15, 40, 15]),
  error: () => vibrate([25, 30, 25, 30, 25])
}
