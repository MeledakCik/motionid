import type { Metadata, Viewport } from 'next';
import {
  Poppins,
  Montserrat,
  Bebas_Neue,
  Playfair_Display,
  Space_Grotesk,
  Anton,
  Plus_Jakarta_Sans,
  Inter_Tight,
} from 'next/font/google';
import './globals.css';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-playfair',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space',
});

const anton = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-anton',
});

/** Huruf brand DepUp (panduan v1.0): Inter Tight untuk semua teks antarmuka. */
const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter-tight',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'video TikTok otomatis',
    'generator video pendek',
    'motion graphic',
    'video Reels',
    'YouTube Shorts',
    'video promo UMKM',
    'quotes video',
    'caption dan hashtag TikTok',
    'tanpa API key',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#EEE9FF',
  colorScheme: 'light',
};

/**
 * Menandai tingkat perangkat di <html> sebelum halaman tampil (aturannya sama dengan lib/studio/device.ts):
 * mk-lite = RAM ≤ 3 GB, CPU ≤ 4 inti, hemat data, atau "kurangi transparansi" → tanpa blur
 * mk-mid  = HP lain / RAM ≤ 6 GB / CPU ≤ 6 inti → blur hanya di header & navigasi
 * mk-hi   = sisanya → blur juga di menu, dialog & panel geser
 *
 * Penjaga otomatis (seperti GlassGuard di Depup Office): saat pertama kali digulir, waktu frame diukur
 * 1,5 detik. Bila median frame > 26 ms (di bawah ±38 fps), tingkatnya turun satu (hi → mid → lite) dan
 * diingat 3 hari di localStorage, jadi HP yang ternyata keberatan langsung lancar tanpa perlu setelan.
 */
const FX_TIER_SCRIPT = `(function(){var d=document.documentElement;try{var n=navigator,w=window,L=['mk-lite','mk-mid','mk-hi'],K='motionku:fx',m=n.deviceMemory||4,c=n.hardwareConcurrency||4,s=n.connection&&n.connection.saveData,mob=/Android|iPhone|iPad|Mobi/i.test(n.userAgent),rt=w.matchMedia&&w.matchMedia('(prefers-reduced-transparency: reduce)').matches,t=m<=3||c<=4||s||rt?0:mob||m<=6||c<=6?1:2,v=null;try{v=localStorage.getItem(K)}catch(e){}if(v){var p=v.split('|');if(Date.now()-p[1]<2592e5){if(+p[0]<t)t=+p[0]}else try{localStorage.removeItem(K)}catch(e){}}d.classList.add(L[t]);if(t&&w.requestAnimationFrame&&w.performance){var go=function(){w.removeEventListener('scroll',go,true);var a=[],l=0,end=performance.now()+1500;requestAnimationFrame(function f(ts){if(l)a.push(ts-l);l=ts;if(ts<end)return requestAnimationFrame(f);a.sort(function(x,y){return x-y});if(a.length>12&&a[a.length>>1]>26){d.classList.remove(L[t]);t--;d.classList.add(L[t]);try{localStorage.setItem(K,t+'|'+Date.now())}catch(e){}}})};w.addEventListener('scroll',go,{passive:true,capture:true})}}catch(e){d.classList.add('mk-mid')}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${poppins.variable} ${montserrat.variable} ${bebasNeue.variable} ${playfair.variable} ${spaceGrotesk.variable} ${anton.variable} ${jakarta.variable} ${interTight.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: FX_TIER_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans text-mk-cream antialiased">
        {children}
      </body>
    </html>
  );
}
