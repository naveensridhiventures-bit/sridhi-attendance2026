/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFFBF2',
          100: '#D7F4DD',
          200: '#A9E7B7',
          300: '#76D78D',
          400: '#45BE63',
          500: '#1F9D4C',
          600: '#147F3D',
          700: '#0F6630',
          800: '#0C5128',
          900: '#093D1F'
        },
        gold: {
          400: '#F2B544',
          500: '#E8A317'
        },
        ink: '#0E2418',
        surface: '#F6FAF7',
        card: '#FFFFFF',
        rust: '#E2483D',
        leaf: '#1F9D4C',
        amber: '#E8A317'
      },
      fontFamily: {
        display: ['"Poppins"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif']
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(15, 102, 48, 0.18)',
        card: '0 2px 12px rgba(14, 36, 24, 0.07)'
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        popIn: {
          '0%': { opacity: 0, transform: 'scale(0.9)' },
          '100%': { opacity: 1, transform: 'scale(1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(31,157,76,0.45)' },
          '70%': { boxShadow: '0 0 0 12px rgba(31,157,76,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(31,157,76,0)' }
        },
        flyAcross: {
          '0%': { transform: 'translate(-10%, 6%) scale(0.9)', opacity: 0 },
          '8%': { opacity: 0.85 },
          '50%': { transform: 'translate(55%, -8%) scale(1.05)' },
          '92%': { opacity: 0.85 },
          '100%': { transform: 'translate(120%, -18%) scale(1.15)', opacity: 0 }
        },
        flap: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(0.45)' }
        },
        toastIn: {
          '0%': { opacity: 0, transform: 'translateY(16px) scale(0.97)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' }
        },
        confettiFall: {
          '0%': { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          '100%': { transform: 'translate(var(--drift), 220px) rotate(var(--rot))', opacity: 0 }
        },
        splashZoom: {
          '0%': { transform: 'scale(0.4)', opacity: 0 },
          '60%': { transform: 'scale(1.08)', opacity: 1 },
          '100%': { transform: 'scale(1)', opacity: 1 }
        },
        sparkFade: {
          '0%': { opacity: 0.9, transform: 'translateY(0) scale(1)' },
          '100%': { opacity: 0, transform: 'translateY(var(--driftY)) scale(0.3)' }
        },
        pageFade: {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        auroraShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        textShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        particleRise: {
          '0%': { transform: 'translateY(0) scale(0.6)', opacity: 0 },
          '15%': { opacity: 0.9 },
          '85%': { opacity: 0.5 },
          '100%': { transform: 'translateY(-130px) scale(1)', opacity: 0 }
        },
        energyShine: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(-100%)' }
        },
        rippleOut: {
          '0%': { transform: 'scale(0)', opacity: 0.55 },
          '100%': { transform: 'scale(1)', opacity: 0 }
        },
        checkDraw: {
          '0%': { strokeDashoffset: 24 },
          '100%': { strokeDashoffset: 0 }
        },
        circuitFlow: {
          '0%': { strokeDashoffset: 0 },
          '100%': { strokeDashoffset: -296 }
        },
        breatheGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(242,213,138,0.35)' },
          '50%': { boxShadow: '0 0 0 10px rgba(242,213,138,0)' }
        },
        idleSway: {
          '0%, 100%': { transform: 'rotate(-1.5deg)' },
          '50%': { transform: 'rotate(1.5deg)' }
        },
        fireFlicker: {
          '0%, 100%': { transform: 'scaleX(1) scaleY(1)', opacity: 0.85 },
          '30%': { transform: 'scaleX(1.12) scaleY(0.92)', opacity: 1 },
          '60%': { transform: 'scaleX(0.94) scaleY(1.08)', opacity: 0.9 }
        },
        emberRise: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: 1 },
          '100%': { transform: 'translateY(var(--riseY)) scale(0.2)', opacity: 0 }
        },
        personBob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        armWave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-14deg)' },
          '50%': { transform: 'rotate(4deg)' },
          '75%': { transform: 'rotate(-10deg)' }
        },
        personBlink: {
          '0%, 92%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.1)' }
        },
        tabletCheck: {
          '0%, 20%': { strokeDashoffset: 30 },
          '50%, 100%': { strokeDashoffset: 0 }
        },
        sparkleFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: 0.9 },
          '50%': { transform: 'translateY(-8px) scale(1.2)', opacity: 1 }
        },
        avatarFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        avatarGlow: {
          '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
          '50%': { opacity: 0.85, transform: 'scale(1.06)' }
        },
        ringSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        shimmerStreak: {
          '0%': { transform: 'translateX(-120%) skewX(-12deg)' },
          '100%': { transform: 'translateX(220%) skewX(-12deg)' }
        },
        iconBounce: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '40%': { transform: 'translateY(-4px) scale(1.08)' },
          '60%': { transform: 'translateY(-2px) scale(1.04)' }
        }
      },
      animation: {
        marquee: 'marquee 18s linear infinite',
        fadeUp: 'fadeUp 0.5s ease-out both',
        popIn: 'popIn 0.35s ease-out both',
        shimmer: 'shimmer 2.5s linear infinite',
        pulseRing: 'pulseRing 2s infinite',
        flyAcross: 'flyAcross linear infinite',
        flap: 'flap 0.55s ease-in-out infinite',
        toastIn: 'toastIn 0.3s ease-out both',
        confettiFall: 'confettiFall ease-out forwards',
        splashZoom: 'splashZoom 0.7s cubic-bezier(.34,1.56,.64,1) both',
        sparkFade: 'sparkFade 0.9s ease-out infinite',
        pageFade: 'pageFade 0.35s ease-out both',
        auroraShift: 'auroraShift 9s ease-in-out infinite',
        textShimmer: 'textShimmer 3.5s linear infinite',
        particleRise: 'particleRise linear infinite',
        energyShine: 'energyShine 2.2s ease-in-out infinite',
        rippleOut: 'rippleOut 0.6s ease-out forwards',
        checkDraw: 'checkDraw 0.5s ease-out 0.1s both',
        circuitFlow: 'circuitFlow 3.5s linear infinite',
        breatheGlow: 'breatheGlow 2.6s ease-in-out infinite',
        idleSway: 'idleSway 4s ease-in-out infinite',
        fireFlicker: 'fireFlicker 0.5s ease-in-out infinite',
        emberRise: 'emberRise 1.1s ease-out infinite',
        personBob: 'personBob 3s ease-in-out infinite',
        armWave: 'armWave 1.8s ease-in-out infinite',
        personBlink: 'personBlink 4.5s ease-in-out infinite',
        tabletCheck: 'tabletCheck 3s ease-in-out infinite',
        sparkleFloat: 'sparkleFloat 2s ease-in-out infinite',
        avatarFloat: 'avatarFloat 3.2s ease-in-out infinite',
        avatarGlow: 'avatarGlow 2.8s ease-in-out infinite',
        ringSpin: 'ringSpin 12s linear infinite',
        shimmerStreak: 'shimmerStreak 4s ease-in-out infinite',
        iconBounce: 'iconBounce 2.5s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
