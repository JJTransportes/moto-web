/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { cobalto: 'var(--accent)', porcelana: 'var(--bg-base)', tinta: 'var(--text-primary)', safira: 'var(--safira-800)', sinal: 'var(--sinal-500)' },
    fontFamily: { sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'], display: ['Sora', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'] },
    borderRadius: { moto: 'var(--radius-lg)' },
    boxShadow: { moto: 'var(--shadow-2)', focus: 'var(--ring-focus)' },
  } },
  plugins: [],
}

