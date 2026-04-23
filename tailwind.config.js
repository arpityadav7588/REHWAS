/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#10B981',
        dark: '#191C1E',
        surface: '#F7F9FB',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F2F4F6',
        'surface-container': '#ECEEF0',
        'surface-container-high': '#E6E8EA',
        'surface-container-highest': '#E0E3E5',
        primary: '#006C49',
        'primary-container': '#10B981',
        'on-primary': '#FFFFFF',
        'on-primary-container': '#00422B',
        secondary: '#545F73',
        'secondary-container': '#D5E0F8',
        'on-secondary': '#FFFFFF',
        'on-secondary-container': '#586377',
        tertiary: '#855300',
        'tertiary-container': '#E29100',
        'on-tertiary': '#FFFFFF',
        'on-tertiary-container': '#523200',
        'on-surface': '#191C1E',
        'on-surface-variant': '#3C4A42',
        outline: '#6C7A71',
        'outline-variant': '#BBCABF',
      },
      fontFamily: {
        headline: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.2)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
