/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        lottery: {
          dark:    '#0a0a14',
          darker:  '#060610',
          navy:    '#0d0d2b',
          purple:  '#1a0a3d',
          accent:  '#f0c040',
          red:     '#e63946',
          blue:    '#4361ee',
          green:   '#2dc653',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'lottery-gradient':   'linear-gradient(135deg, #0a0a14 0%, #1a0a3d 50%, #0a0a14 100%)',
        'gold-gradient':      'linear-gradient(135deg, #f59e0b, #fcd34d, #f59e0b)',
        'card-gradient':      'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
      },
      animation: {
        'ball-fall':   'ballFall 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'float':       'float 3s ease-in-out infinite',
        'spin-slow':   'spin 8s linear infinite',
        'ticker':      'ticker 20s linear infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'count-up':    'countUp 0.5s ease-out forwards',
      },
      keyframes: {
        ballFall: {
          '0%':   { transform: 'translateY(-100px) scale(0.5)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)',        opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(240,192,64,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(240,192,64,0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        ticker: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'gold': '0 0 30px rgba(240,192,64,0.4)',
        'card': '0 8px 32px rgba(0,0,0,0.4)',
        'inset-gold': 'inset 0 1px 0 rgba(240,192,64,0.2)',
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
}
