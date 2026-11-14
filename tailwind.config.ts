import type { Config } from 'tailwindcss';

/**
 * Warna khas MotionKu: "Depup Violet" — selaras dengan depup.cloud.
 * Violet-biru #7B50FF di atas lavender terang, kartu kaca putih, panel gelap #1E1150, aksen limau #C6F432.
 * Nama token lama dipertahankan supaya semua komponen tetap jalan, dengan makna:
 *   coral = warna utama · amber = peringatan · mint = sukses · ink = kolom/input
 *   night = latar halaman · panel* = kartu · cream = teks utama · muted/dim = teks sekunder
 */
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        mk: {
          coral: '#7B50FF',
          'coral-2': '#9775FF',
          amber: '#B45309',
          ink: '#F3EFFF',
          night: '#ECE6FF',
          panel: '#FFFFFF',
          'panel-2': '#F7F5FF',
          'panel-3': '#EAE3FF',
          line: 'rgba(18,11,46,0.09)',
          'line-2': 'rgba(18,11,46,0.16)',
          cream: '#120B2E',
          muted: '#544D6C',
          dim: '#6E6789',
          mint: '#3F7D16',
          sky: '#2563EB',
          lime: '#C6F432',
          deep: '#1E1150',
        },
      },
      backgroundImage: {
        'mk-grad': 'linear-gradient(100deg, #6A3CF6 0%, #7B50FF 55%, #9775FF 100%)',
        'mk-night':
          'radial-gradient(900px circle at 0% -10%, rgba(123,80,255,0.18), transparent 60%), radial-gradient(800px circle at 100% 0%, rgba(151,117,255,0.16), transparent 55%), radial-gradient(700px circle at 50% 115%, rgba(91,120,255,0.14), transparent 60%), linear-gradient(180deg, #F2EEFF 0%, #E8E0FF 100%)',
      },
      boxShadow: {
        'mk-glow': '0 12px 30px -12px rgba(123,80,255,0.6)',
        'mk-card': 'inset 0 1px 0 rgba(255,255,255,0.7), 0 18px 40px -24px rgba(48,24,140,0.35)',
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
