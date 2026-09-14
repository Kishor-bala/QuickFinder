/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        psg: {
          navy: '#2E2A88',       // Single PSG Logo Blue (#2E2A88)
          dark: '#201D60',       // Darker tone for hover states
          royal: '#2E2A88',      // Unified Single Blue
          blue: '#2E2A88',       // Unified Single Blue
          sky: '#3F3B9E',        // Slightly brighter tone for highlights
          lightBlue: '#EEEDFA',  // Soft Tint Background
          slate: '#F8FAFC',      // Clean Light Content Background
        },
        brand: {
          50: '#F5F4FD',
          100: '#EEEDFA',
          200: '#DDD9F5',
          300: '#8A85D9',
          400: '#4D47B8',
          500: '#2E2A88',        // PSG Logo Blue
          600: '#262372',
          700: '#201D60',
          800: '#171547',
          900: '#0E0D2E',
        },
        accent: {
          blue: '#2E2A88',
          royal: '#2E2A88',
          navy: '#2E2A88',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'psg': '0 10px 30px -10px rgba(46, 42, 136, 0.35)',
        'psg-lg': '0 20px 40px -15px rgba(46, 42, 136, 0.45)',
        'royal': '0 10px 25px -5px rgba(46, 42, 136, 0.35)',
      }
    },
  },
  plugins: [],
}
