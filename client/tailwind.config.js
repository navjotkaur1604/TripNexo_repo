/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        navy: {
          950: '#070B14',
          900: '#0B1120',
          800: '#111827',
          700: '#1E293B',
        },
      },
    },
  },
  plugins: [],
};
