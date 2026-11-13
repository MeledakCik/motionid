import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import {
  COLOR_PALETTES,
  CategoryType,
  GenerateOptions,
  SceneItem,
  generateScript,
  getStylePacks,
} from '@/lib/smart-engine';
import { EdukasiPhone, PhoneFrame, PromoPhone, QuotePhone } from '@/components/landing/PhoneDemos';

// Plus Jakarta Sans: huruf yang dirancang untuk identitas kota Jakarta, hanya dimuat di landing page.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  inLanguage: 'id-ID',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
};

/* -------------------------------------------------------------------------- */
/* Contoh dari generator asli (dihitung saat build, seed tetap)                */
/* -------------------------------------------------------------------------- */

const EXAMPLE_INPUTS: Array<{ label: string; topic: string; category: CategoryType; options: GenerateOptions }> = [
  {
    label: 'Promo',
    topic: 'promo kopi susu gula aren dari 25rb jadi 18rb, nuansa hangat',
    category: 'promo',
    options: { seed: 11, customStoreName: 'Kedai Kopi Senja', stylePackId: 'poster-promo', variant: 'A' },
  },
  {
    label: 'Quote',
    topic: 'kata-kata buat yang lagi capek kerja',
    category: 'quote',
    options: { seed: 5, stylePackId: 'ink-quote', variant: 'A' },
  },
  {
    label: 'Edukasi',
    topic: '3 cara mengatur keuangan di usia 20an',
    category: 'edukasi',
    options: { seed: 3, stylePackId: 'mint-study', variant: 'A' },
  },
];

const EXAMPLES = EXAMPLE_INPUTS.map((ex) => {
  const result = generateScript(ex.topic, ex.category, ex.options);
  const seconds = result.scenes.reduce((acc, s) => acc + s.duration, 0);
  return { ...ex, result, seconds };
});

const [promoEx, quoteEx, eduEx] = EXAMPLES;
const promoMeta = promoEx.result.extractedMeta;
const priceScene = promoEx.result.scenes[2];
const eduSteps = (eduEx.result.scenes[1].secondaryInput || '')
  .split('|')
  .map((s) => s.trim().replace(/^\d+\.\s*/, ''))
  .filter(Boolean);

const STYLE_SWATCHES = getStylePacks()
  .filter((p) => !p.trained)
  .map((p) => {
    const pal = COLOR_PALETTES.find((c) => c.id === p.paletteId);
    return { name: p.name, colors: pal ? [pal.bgPrimary, pal.bgSecondary, pal.accentColor] : ['#ddd', '#aaa', '#666'] };
  });

function formatSeconds(n: number) {
  return `${n.toFixed(1).replace('.', ',')} detik`;
}

function sceneDetail(scene: SceneItem): string {
  const items = (scene.secondaryInput || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  switch (scene.widgetType) {
    case 'quote_card':
      return scene.primaryInput ? `“${scene.primaryInput}”` : '';
    case 'checklist_card':
      return items.map((s) => s.replace(/^\d+\.\s*/, '')).join(', ');
    case 'price_tag_card':
      return [scene.primaryInput, ...items].filter(Boolean).join(', ');
    case 'step_number_card':
      return [scene.primaryInput === '!' ? '' : scene.primaryInput, ...items].filter(Boolean).join(' ');
    case 'cta_button_card':
      return scene.primaryInput ? `Tombol “${scene.primaryInput}”` : '';
    default:
      return '';
  }
}

/* -------------------------------------------------------------------------- */
/* UI kecil                                                                   */
/* -------------------------------------------------------------------------- */

const BTN_PRIMARY =
  'mk-focus inline-flex items-center justify-center rounded-xl bg-[#F4F2FF] px-5 py-3 text-[15px] font-semibold text-[#1A1240] shadow-[0_14px_36px_-14px_rgba(139,124,255,0.95)] transition-colors hover:bg-white';
const BTN_GLASS =
  'mk-focus mk-glass-soft inline-flex items-center justify-center rounded-xl px-5 py-3 text-[15px] font-semibold text-[#F4F2FF] transition-colors hover:bg-white/10';
const H2 = 'text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#F4F2FF] sm:text-[40px]';
const LEAD = 'mt-3 max-w-[60ch] text-[16px] leading-relaxed text-[#A9A3C9]';

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
        <defs>
          <linearGradient id="mk-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8B7CFF" />
            <stop offset="1" stopColor="#C8F169" />
          </linearGradient>
        </defs>
        <rect width="30" height="30" rx="9" fill="url(#mk-logo)" />
        <path d="M12 9.5v11l9-5.5z" fill="#140F33" />
        <path d="M6.5 12h3M5 15h4.5M6.5 18h3" stroke="#140F33" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="text-[17px] font-extrabold tracking-[-0.02em] text-[#F4F2FF]">MotionKu</span>
    </span>
  );
}

function Chip({ children, delay }: { children: React.ReactNode; delay?: number }) {
  return (
    <span
      className={`rounded-full border border-white/12 bg-white/[0.07] px-2.5 py-1 text-[12px] text-[#DCD7F5] ${delay !== undefined ? 'mk-once' : ''}`}
      style={delay !== undefined ? { animationName: 'mk-chip', animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </span>
  );
}

const FAQ = [
  ['Apakah MotionKu gratis?', 'Ya. Kamu cukup masuk dengan akun Google, tanpa kartu kredit.'],
  [
    'Perlu aplikasi edit video?',
    'Tidak. Dari menulis topik sampai render, semuanya berjalan di browser, termasuk di HP.',
  ],
  [
    'Format videonya apa?',
    'MP4 1080p di Chrome, Edge, dan Safari versi terbaru. Di browser yang belum bisa merekam MP4 (misalnya Firefox), hasilnya WebM.',
  ],
  [
    'Bagaimana MotionKu memahami prompt?',
    'MotionKu memakai mesin aturan buatan sendiri, bukan layanan AI pihak ketiga. Nama produk, harga, suasana, warna, dan platform dikenali dari kalimatmu, lalu dipakai untuk menyusun naskah dan memilih gaya. Makin jelas prompt-nya, makin pas hasilnya.',
  ],
  [
    'Apakah teksnya bisa diubah?',
    'Bisa. Setiap scene bisa diedit: judul, isi kartu, layout, latar, transisi, dan animasi judul.',
  ],
  [
    'Ukuran apa saja yang tersedia?',
    '9:16, 1:1, dan 16:9. Kalau prompt menyebut story WA, feed IG, atau YouTube, ukurannya menyesuaikan otomatis.',
  ],
];

/* -------------------------------------------------------------------------- */
/* Halaman                                                                    */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <div className={`${jakarta.className} relative min-h-screen overflow-x-clip text-[#F4F2FF]`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div aria-hidden className="mk-bg pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden className="mk-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]" />

      {/* Navigasi */}
      <header className="sticky top-3 z-40 px-3 sm:px-5">
        <nav className="mk-glass mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-2xl pl-3.5 pr-2">
          <Link href="/" className="mk-focus rounded-lg" aria-label="MotionKu, ke beranda">
            <Logo />
          </Link>
          <div className="hidden items-center gap-1 text-[14px] text-[#C9C3E6] md:flex">
            {[
              ['#contoh', 'Contoh'],
              ['#cara-kerja', 'Cara kerja'],
              ['#fitur', 'Fitur'],
              ['#faq', 'FAQ'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="mk-focus rounded-lg px-3 py-2 transition-colors hover:text-white">
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Link href="/login" className="mk-focus rounded-lg px-3 py-2 text-[14px] font-medium text-[#C9C3E6] hover:text-white">
              Masuk
            </Link>
            <Link
              href="/create"
              className="mk-focus rounded-xl bg-[#F4F2FF] px-3.5 py-2 text-[14px] font-semibold text-[#1A1240] hover:bg-white"
            >
              Buat video
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1.02fr_1fr] lg:gap-12">
          <div>
            <h1 className="text-[42px] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-[60px] lg:text-[68px]">
              Ketik topik.
              <br />
              Jadi video siap upload.
            </h1>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-[#B7B1D6]">
              MotionKu menyusun naskah, gaya visual, dan animasi dari satu kalimat. Hasilnya video MP4 1080p untuk
              TikTok, Reels, Shorts, dan status WhatsApp, dirender langsung di browser.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/create" className={BTN_PRIMARY}>
                Buat video gratis
              </Link>
              <a href="#contoh" className={BTN_GLASS}>
                Lihat contoh
              </a>
            </div>
            <p className="mt-5 text-[13px] text-[#8D86B5]">Gratis. Masuk dengan Google, tanpa aplikasi tambahan.</p>
          </div>

          {/* Jendela studio kaca: prompt dibaca, lalu jadi video */}
          <div className="mk-glass rounded-[28px] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#DCD7F5]">Studio</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] text-[#DCD7F5]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C8F169]" aria-hidden />
                Siap render 1080p
              </span>
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-[#0B0820]/55 px-3.5 py-3 text-[14px] leading-snug text-[#F4F2FF]">
              {promoEx.topic}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Yang terbaca dari prompt">
              <Chip delay={0.5}>topik: kopi</Chip>
              <Chip delay={0.7}>suasana: hangat</Chip>
              <Chip delay={0.9}>hemat {promoMeta.discountPercent}%</Chip>
              <Chip delay={1.1}>rasio 9:16</Chip>
            </div>

            <div className="relative mt-5 flex h-[390px] items-end justify-center sm:h-[400px]">
              <PhoneFrame
                label={`Contoh video quote: ${quoteEx.result.hook}`}
                className="absolute bottom-6 left-[2%] hidden w-[37%] -rotate-[7deg] text-[11px] opacity-90 sm:block"
              >
                <QuotePhone
                  badge={quoteEx.result.scenes[0].stepBadge || 'Untukmu'}
                  title={quoteEx.result.scenes[0].text}
                  quote={quoteEx.result.scenes[0].primaryInput || ''}
                  offset={1.4}
                />
              </PhoneFrame>
              <PhoneFrame
                label={`Contoh video edukasi: ${eduEx.result.hook}`}
                className="absolute bottom-6 right-[2%] hidden w-[37%] rotate-[7deg] text-[11px] opacity-90 sm:block"
              >
                <EdukasiPhone badge={eduEx.result.scenes[1].stepBadge || 'Langkahnya'} title={eduEx.result.hook} steps={eduSteps} offset={2.8} />
              </PhoneFrame>
              <PhoneFrame label={`Contoh video promo: ${priceScene.text}`} className="relative z-10 w-[62%] max-w-[230px] text-[13px] sm:w-[44%]">
                <PromoPhone
                  badge={priceScene.stepBadge || 'Harga spesial'}
                  title={priceScene.text}
                  emphasis={(priceScene.emphasis || '').split('|')}
                  sub={priceScene.subtext}
                  store={promoMeta.storeName}
                  product={promoMeta.productName}
                  normal={promoMeta.originalPriceText}
                  price={promoMeta.priceText}
                  sticker={promoMeta.discountPercent ? `Hemat ${promoMeta.discountPercent}%` : 'Promo'}
                />
              </PhoneFrame>
            </div>
          </div>
        </section>

        {/* Ukuran */}
        <section className="mx-auto max-w-6xl px-5 pb-20" aria-labelledby="ukuran">
          <div className="mk-glass-soft grid gap-4 rounded-[24px] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
            <h2 id="ukuran" className="text-[18px] font-bold tracking-[-0.01em]">
              Satu proyek, tiga ukuran.
            </h2>
            <ul className="flex flex-wrap gap-2.5">
              {[
                ['9:16', 'TikTok, Reels, Shorts, status WA', 9, 16],
                ['1:1', 'Feed Instagram', 1, 1],
                ['16:9', 'YouTube', 16, 9],
              ].map(([ratio, use, w, h]) => (
                <li key={String(ratio)} className="flex items-center gap-2.5 rounded-xl bg-white/[0.05] px-3 py-2">
                  <span
                    aria-hidden
                    className="block rounded-[3px] border border-[#C9C3E6]/70"
                    style={{ width: Number(w) > Number(h) ? 22 : (22 * Number(w)) / Number(h), height: Number(h) >= Number(w) ? 22 : (22 * Number(h)) / Number(w) }}
                  />
                  <span className="text-[14px] font-semibold">{ratio}</span>
                  <span className="text-[13px] text-[#A9A3C9]">{use}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contoh hasil generator */}
        <section id="contoh" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-24">
          <h2 className={H2}>Contoh hasil dari satu kalimat.</h2>
          <p className={LEAD}>Tiga prompt di bawah ditulis apa adanya. Naskah yang tampil adalah hasil generator tanpa diedit.</p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {EXAMPLES.map((ex) => (
              <article key={ex.label} className="mk-glass flex flex-col rounded-[24px] p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[17px] font-bold">{ex.label}</h3>
                  <span className="text-[13px] text-[#A9A3C9]">
                    {ex.result.scenes.length} scene, {formatSeconds(ex.seconds)}
                  </span>
                </div>
                <p className="mt-3 rounded-xl border border-white/10 bg-[#0B0820]/50 px-3 py-2.5 text-[14px] text-[#E8E4FA]">
                  {ex.topic}
                </p>
                <p className="mt-2 text-[12px] text-[#8D86B5]">Gaya terpilih: {ex.result.recipe?.packName}</p>
                <ol className="mt-4 space-y-3">
                  {ex.result.scenes.map((scene, i) => (
                    <li key={scene.id} className="grid grid-cols-[22px_1fr] gap-2.5">
                      <span className="mt-0.5 grid h-[22px] w-[22px] place-items-center rounded-full bg-white/[0.08] text-[11px] font-bold text-[#C9C3E6]">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-[14px] font-semibold leading-snug text-[#F4F2FF]">{scene.text}</p>
                        {sceneDetail(scene) && (
                          <p className="mt-0.5 text-[13px] leading-snug text-[#A9A3C9]">{sceneDetail(scene)}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        {/* Cara kerja */}
        <section id="cara-kerja" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-24">
          <h2 className={H2}>Tiga langkah dari ide ke video.</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              [
                'Ketik topiknya',
                'Sebut produk, harga, suasana, atau tujuan postingnya.',
                'promo bakso 15rb buat story WA, nuansa merah',
              ],
              [
                'Rapikan di editor',
                'Ganti teks, layout, latar, dan transisi tiap scene. Klik Acak gaya kalau mau tampilan lain.',
                'Layout: kartu di atas, transisi: zoom',
              ],
              [
                'Render dan bagikan',
                'Unduh MP4 1080p, atau kirim langsung ke TikTok, Instagram, dan WhatsApp dari HP.',
                'promo-bakso-9x16.mp4',
              ],
            ].map(([title, body, sample], i) => (
              <li key={title} className="mk-glass rounded-[24px] p-5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F4F2FF] text-[14px] font-extrabold text-[#1A1240]">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-[18px] font-bold">{title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-[#A9A3C9]">{body}</p>
                <p className="mt-4 rounded-xl border border-white/10 bg-[#0B0820]/45 px-3 py-2 text-[13px] text-[#DCD7F5]">{sample}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Fitur */}
        <section id="fitur" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-24">
          <h2 className={H2}>Yang dikerjakan MotionKu untukmu.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-6">
            <article className="mk-glass rounded-[24px] p-6 md:col-span-4">
              <h3 className="text-[18px] font-bold">Paham maksud prompt</h3>
              <p className="mt-1.5 max-w-[52ch] text-[15px] leading-relaxed text-[#A9A3C9]">
                Topik, suasana, warna, dan platform dibaca dari kalimatmu, lalu dipakai untuk memilih naskah dan gaya.
              </p>
              <div className="mt-5 rounded-2xl border border-white/10 bg-[#0B0820]/45 p-4">
                <p className="text-[14px] text-[#E8E4FA]">flash sale sepatu sneakers diskon 50%, hari ini</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Chip>topik: fashion</Chip>
                  <Chip>energi: tinggi</Chip>
                  <Chip>mendesak</Chip>
                  <Chip>tonjolkan: 50%</Chip>
                </div>
                <p className="mt-3 text-[13px] text-[#C9C3E6]">
                  Gaya Flash Sale: latar garis miring, transisi kilat, judul “FLASH SALE! Sepatu Sneakers…”
                </p>
              </div>
            </article>

            <article className="mk-glass rounded-[24px] p-6 md:col-span-2 md:row-span-2">
              <h3 className="text-[18px] font-bold">{STYLE_SWATCHES.length} gaya visual</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[#A9A3C9]">Setiap klik memberi variasi baru, tetap searah dengan prompt.</p>
              <ul className="mt-5 space-y-2">
                {STYLE_SWATCHES.map((s) => (
                  <li key={s.name} className="flex items-center justify-between gap-3 text-[13px] text-[#DCD7F5]">
                    <span>{s.name}</span>
                    <span className="flex" aria-hidden>
                      {s.colors.map((c, i) => (
                        <span key={i} className="-ml-1 h-4 w-4 rounded-full border border-white/25 first:ml-0" style={{ background: c }} />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="mk-glass rounded-[24px] p-6 md:col-span-2">
              <h3 className="text-[18px] font-bold">Kartu sesuai isi</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[#A9A3C9]">
                Harga coret untuk promo, kartu kutipan untuk quote, daftar bernomor untuk edukasi.
              </p>
            </article>

            <article className="mk-glass rounded-[24px] p-6 md:col-span-2">
              <h3 className="text-[18px] font-bold">MP4 1080p, durasi penuh</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[#A9A3C9]">Bisa ditambah ketukan musik sesuai tempo gaya.</p>
              <div className="mt-4" aria-hidden>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[72%] rounded-full bg-[#C8F169]" />
                </div>
                <p className="mt-2 text-[12px] text-[#A9A3C9]">Merekam 72%</p>
              </div>
            </article>

            <article className="mk-glass rounded-[24px] p-6 md:col-span-3">
              <h3 className="text-[18px] font-bold">Tersimpan otomatis</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[#A9A3C9]">
                Setiap perubahan tersimpan ke akunmu dan bisa dibuka lagi dari dashboard.
              </p>
            </article>

            <article className="mk-glass rounded-[24px] p-6 md:col-span-3">
              <h3 className="text-[18px] font-bold">Edit setiap scene</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[#A9A3C9]">
                Teks, isi kartu, layout, latar, transisi, animasi judul, dan font.
              </p>
            </article>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 pb-24">
          <h2 className={H2}>Pertanyaan yang sering muncul.</h2>
          <div className="mt-8 space-y-2.5">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group mk-glass-soft rounded-2xl px-5 py-4">
                <summary className="mk-focus flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-[16px] font-semibold">
                  {q}
                  <span aria-hidden className="text-[22px] font-light leading-none text-[#C9C3E6] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-[#A9A3C9]">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Ajakan akhir */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="mk-glass relative overflow-hidden rounded-[32px] px-6 py-12 text-center sm:px-12 sm:py-16">
            <div aria-hidden className="mk-cta-glow pointer-events-none absolute inset-0" />
            <h2 className="relative text-[32px] font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-[44px]">
              Video pertamamu cukup satu kalimat.
            </h2>
            <p className="relative mx-auto mt-3 max-w-[46ch] text-[16px] text-[#B7B1D6]">
              Tulis topiknya, lihat hasilnya, lalu unduh MP4-nya.
            </p>
            <Link href="/create" className={`${BTN_PRIMARY} relative mt-8`}>
              Buat video gratis
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-[40ch] text-[14px] text-[#8D86B5]">
              Generator video pendek untuk UMKM, kreator, dan edukator.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#C9C3E6]" aria-label="Tautan footer">
            <a href="#contoh" className="mk-focus rounded hover:text-white">Contoh</a>
            <a href="#cara-kerja" className="mk-focus rounded hover:text-white">Cara kerja</a>
            <a href="#faq" className="mk-focus rounded hover:text-white">FAQ</a>
            <Link href="/login" className="mk-focus rounded hover:text-white">Masuk</Link>
            <Link href="/dashboard" className="mk-focus rounded hover:text-white">Dashboard</Link>
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-5 pb-10 text-[13px] text-[#6F6896]">© 2026 MotionKu</p>
      </footer>
    </div>
  );
}
