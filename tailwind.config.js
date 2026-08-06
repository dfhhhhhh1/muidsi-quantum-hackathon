/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Mizzou black & gold, tuned for a dark UI.
        mizzou: {
          gold: '#F1B82D',
          deep: '#C08A12',
          black: '#000000',
        },
        // Quantum-lab accents.
        q: {
          cyan: '#22D3EE',
          ice: '#7DE9FF',
          violet: '#8B5CF6',
          copper: '#E8A33D',
          alert: '#FF6B4A',
          void: '#04060D',
          panel: '#080D18',
        },
      },
      fontFamily: {
        display: ['"IBM Plex Sans Condensed"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 3.2s ease-in-out infinite',
        scan: 'scan 6s linear infinite',
        'float-slow': 'float-slow 7s ease-in-out infinite',
        blink: 'blink 1s step-end infinite',
      },
      boxShadow: {
        glow: '0 0 24px rgba(34, 211, 238, 0.35), 0 0 64px rgba(34, 211, 238, 0.12)',
        'glow-gold': '0 0 24px rgba(241, 184, 45, 0.4), 0 0 72px rgba(241, 184, 45, 0.15)',
      },
    },
  },
  plugins: [],
};
