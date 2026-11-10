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
