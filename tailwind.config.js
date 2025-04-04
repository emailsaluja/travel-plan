/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'airbnb': {
          DEFAULT: '#FF385C',
          dark: '#E31C5F',
        },
        'stippl-green': '#00C48C',
        'stippl-darkGreen': '#00B380',
        'stippl-purple': '#6366F1',
        'stippl-red': '#F43F5E',
        'stippl-yellow': '#F59E0B',
        'stippl-lightGray': '#F3F4F6',
        'stippl-lightGreen': '#ECFDF5',
        travel: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        sans: ['Circular', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  extend: {
    utilities: {
      '.no-scrollbar': {
        /* Hide scrollbar for Chrome, Safari and Opera */
        '::-webkit-scrollbar': {
          'display': 'none'
        },
        /* Hide scrollbar for IE, Edge and Firefox */
        '-ms-overflow-style': 'none',  /* IE and Edge */
        'scrollbar-width': 'none'  /* Firefox */
      }
    }
  }
};
