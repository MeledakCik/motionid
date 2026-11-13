import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          iris: '#7C6CFF',
          irisSoft: '#9D91FF',
          lime: '#C8F169',
          midnight: '#0E0A24',
          panel: '#141026',
          line: 'rgba(255,255,255,0.09)',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(92deg, #7C6CFF 0%, #9D91FF 48%, #C8F169 100%)',
        'brand-night':
          'radial-gradient(720px circle at 12% -8%, rgba(124,108,255,0.16), transparent 62%), radial-gradient(560px circle at 96% 18%, rgba(200,241,105,0.07), transparent 60%), #090a0f',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        bebas: ['var(--font-bebas)', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'serif'],
        space: ['var(--font-space)', 'sans-serif'],
        anton: ['var(--font-anton)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
