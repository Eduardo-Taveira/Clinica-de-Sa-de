/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#0b2f36', 900: '#143f48', 800: '#215b63' },
        sea: { 50: '#e8f7f1', 100: '#d9f2e9', 200: '#aee4d5', 300: '#82d6c5', 400: '#51bfb0', 500: '#22a79b', 600: '#148a82', 700: '#0c6f6b', 800: '#075a58' },
        canvas: '#f4f8f8',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'] },
      boxShadow: {
        panel: '0 14px 38px rgba(14,42,61,.055)',
        float: '0 20px 65px rgba(9,54,69,.14)',
      },
    },
  },
  plugins: [],
};
