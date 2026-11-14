import type { Config } from 'tailwindcss';

/**
 * Warna khas MotionKu: "Sunset Coral" — coral hangat + amber di atas tinta cokelat gelap.
 * Dipakai konsisten di landing, dashboard, create, editor, dan admin.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        mk: {
          coral: '#FF6A3D',
          'coral-2': '#FF8A5C',
          amber: '#FFB547',
          ink: '#120E0C',
          night: '#0C0908',
          panel: '#1B1512',
          'panel-2': '#241C18',
          'panel-3': '#2E2420',
          line: 'rgba(255,236,220,0.10)',
          'line-2': 'rgba(255,236,220,0.18)',
          cream: '#FFF3EA',
          muted: '#BBA99C',
          dim: '#8C7B70',
          mint: '#3EE6B0',
          sky: '#5AB8FF',
        },
      },
      backgroundImage: {
        'mk-grad': 'linear-gradient(100deg, #FF6A3D 0%, #FF8A4C 45%, #FFB547 100%)',
        'mk-night':
          'radial-gradient(800px circle at 10% -10%, rgba(255,106,61,0.20), transparent 60%), radial-gradient(600px circle at 100% 10%, rgba(255,181,71,0.10), transparent 60%), #120E0C',
      },
      boxShadow: {
        'mk-glow': '0 10px 40px -10px rgba(255,106,61,0.55)',
        'mk-card': '0 20px 50px -24px rgba(0,0,0,0.7)',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'var(--font-poppins)', 'system-ui', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        bebas: ['var(--font-bebas)', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'serif'],
        space: ['var(--font-space)', 'sans-serif'],
        anton: ['var(--font-anton)', 'sans-serif'],
      },
      keyframes: {
        'mk-up': { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        'mk-sheet': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'mk-pulse': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
      },
      animation: {
        'mk-up': 'mk-up .35s ease-out both',
        'mk-sheet': 'mk-sheet .28s cubic-bezier(.2,.8,.2,1) both',
        'mk-pulse': 'mk-pulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
