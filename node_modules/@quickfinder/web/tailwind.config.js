/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        psg: {
          navy: '#0B192C',
          dark: '#0F172A',
          blue: '#1E3A8A',
          royal: '#1D4ED8',
          lightBlue: '#3B82F6',
          gold: '#F59E0B',
          amber: '#D97706',
          slate: '#F8FAFC',
        },
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#1E3A8A', // mapped to PSG Blue
          600: '#0B192C', // mapped to PSG Navy
          700: '#0F172A',
          800: '#111827',
          900: '#030712',
        },
        accent: {
          gold: '#F59E0B',
          amber: '#D97706',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'psg': '0 10px 30px -10px rgba(11, 25, 44, 0.15)',
        'psg-lg': '0 20px 40px -15px rgba(11, 25, 44, 0.25)',
        'gold': '0 10px 25px -5px rgba(245, 158, 11, 0.3)',
      }
    },
  },
  plugins: [],
}
