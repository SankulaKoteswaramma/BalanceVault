/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#fdfbf7',
          100: '#faf8f5',
          200: '#f4efe6',
          300: '#ebe3d3',
          400: '#ded2bc',
          500: '#cdbda1',
        },
        crimson: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        ink: {
          950: '#050505',
          900: '#0a0a0a',
          850: '#121212',
          800: '#18181b',
          700: '#27272a',
          600: '#3f3f46',
          500: '#52525b',
          400: '#71717a',
          300: '#a1a1aa',
          200: '#d4d4d8',
          100: '#e4e4e7',
          50: '#f4f4f5',
        },
      },
      boxShadow: {
        'clean': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 20px -2px rgba(18, 18, 18, 0.06), 0 2px 6px -1px rgba(18, 18, 18, 0.04)',
        'elevated': '0 12px 32px -4px rgba(18, 18, 18, 0.08), 0 4px 12px -2px rgba(18, 18, 18, 0.04)',
        'crimson': '0 8px 24px -4px rgba(220, 38, 38, 0.25)',
      },
    },
  },
  plugins: [],
}
