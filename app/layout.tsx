import type { Metadata } from 'next';
import {
  Poppins,
  Montserrat,
  Bebas_Neue,
  Playfair_Display,
  Space_Grotesk,
  Anton,
} from 'next/font/google';
import './globals.css';

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

export const metadata: Metadata = {
  title: 'MotionKu — AI Motion Graphic Generator Tanpa API Key',
  description:
    'Ketik Topik, Jadi Video TikTok, Reels & Shorts otomatis dengan Smart Template Engine & Rule-Based Generator tanpa biaya API AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`dark ${poppins.variable} ${montserrat.variable} ${bebasNeue.variable} ${playfair.variable} ${spaceGrotesk.variable} ${anton.variable}`}
    >
      <body className="min-h-screen bg-slate-950 text-slate-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
