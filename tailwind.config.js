/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sleek Dark Theme palette declared as static colors for Tailwind v3 opacity compiler support
        'bg-primary': '#0b0c10',
        'bg-secondary': '#1f2833',
        'bg-tertiary': '#12161f',
        'accent-cyan': '#66fcf1',
        'accent-teal': '#45f3ff',
        'text-primary': '#ffffff',
        'text-secondary': '#c5c6c7',
        'border-color': 'rgba(255, 255, 255, 0.08)',
        'error': '#ff4d4f',
        'success': '#52c41a',
      },
      fontFamily: {
        sans: ['Outfit', 'Sarabun', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
