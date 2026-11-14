import type { Metadata, Viewport } from 'next';
import {
  Poppins,
  Montserrat,
  Bebas_Neue,
  Playfair_Display,
  Space_Grotesk,
  Anton,
  Plus_Jakarta_Sans,
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
 * mk-mid  = HP lain / RAM ≤ 6 GB / CPU ≤ 6 inti → blur tipis
 * mk-hi   = sisanya → blur penuh
 */
const FX_TIER_SCRIPT = `(function(){try{var n=navigator,d=document.documentElement,m=n.deviceMemory||4,c=n.hardwareConcurrency||4,s=n.connection&&n.connection.saveData,mob=/Android|iPhone|iPad|Mobi/i.test(n.userAgent),rt=window.matchMedia&&window.matchMedia('(prefers-reduced-transparency: reduce)').matches;d.classList.add(m<=3||c<=4||s||rt?'mk-lite':mob||m<=6||c<=6?'mk-mid':'mk-hi')}catch(e){document.documentElement.classList.add('mk-mid')}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${poppins.variable} ${montserrat.variable} ${bebasNeue.variable} ${playfair.variable} ${spaceGrotesk.variable} ${anton.variable} ${jakarta.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: FX_TIER_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-mk-night font-sans text-mk-cream antialiased">
        {children}
      </body>
    </html>
  );
}
