import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Original Unsay-Sud-an Brand Palette
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Primary brand orange
          600: '#ea580c', // Dark brand orange
          700: '#c2410c', // Deep burnt orange
          800: '#9a3412',
          900: '#7c2d12',
          DEFAULT: '#f97316',
          primary: '#f97316',
          accent: '#ea580c',
          amber: '#f59e0b',
          bg: '#FAF7F2',
          surface: '#FFFFFF',
          subtle: '#F5F2EB',
          border: '#E5E0D8',
          charcoal: '#1C1917',
        },
        // Warm neutral tones
        warm: {
          50: '#FAF7F2',
          100: '#F5F2EB',
          200: '#EDE8DF',
          300: '#DDD7CD',
          400: '#C4BDB0',
          500: '#9C9588',
          600: '#736D61',
          700: '#524D43',
          800: '#36322A',
          900: '#1C1917',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
