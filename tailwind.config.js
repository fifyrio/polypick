/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Warm paper background palette
        paper: {
          DEFAULT: '#f5f3ee',
          card: '#faf9f5',
          line: '#e7e3d9',
        },
        ink: {
          DEFAULT: '#1a1a17',
          soft: '#4b4b45',
          faint: '#8f8c82',
        },
        // Brand green
        brand: {
          50: '#eafbe7',
          100: '#d3f7cf',
          400: '#3fcf4e',
          500: '#22c03a',
          600: '#16a331',
          700: '#0f7a24',
          900: '#0a3d14',
          ink: '#062b0e',
        },
        market: {
          yes: '#16a331',
          no: '#dc2626',
        },
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(26,26,23,0.04), 0 8px 24px -12px rgba(26,26,23,0.12)',
        pop: '0 12px 40px -12px rgba(6,43,14,0.35)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popCheck: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '60%': { transform: 'scale(1.15)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        grow: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        spinSlow: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'rise-in': 'riseIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'pop-check': 'popCheck 0.35s cubic-bezier(0.16,1,0.3,1) both',
        grow: 'grow 0.7s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        'spin-slow': 'spinSlow 0.9s linear infinite',
      },
    },
  },
  plugins: [],
}
