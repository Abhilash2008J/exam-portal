/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['DM Serif Display', 'Georgia', 'serif'],
      },
      colors: {
        paper: '#F7F5F0',
        ink: '#1E2A3A',
        cobalt: '#3157D5',
        sage: '#6C8A76',
      },
      boxShadow: {
        soft: '0 16px 45px rgba(30, 42, 58, 0.08)',
      },
    },
  },
  plugins: [],
};
