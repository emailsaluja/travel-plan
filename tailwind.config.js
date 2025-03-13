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
      },
      fontFamily: {
        sans: ['Circular', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
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
