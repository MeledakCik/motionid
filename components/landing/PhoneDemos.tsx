import type { CSSProperties, ReactNode } from 'react';

/**
 * Mockup layar HP untuk landing page. Isinya diambil dari hasil generateScript (lihat app/page.tsx),
 * gayanya meniru kartu yang digambar Motion Studio. Animasi murni CSS (lihat .mk-loop di globals.css)
 * dan otomatis diam bila pengguna memilih "kurangi gerakan".
 */

const STARBURST = `polygon(${Array.from({ length: 28 }, (_, i) => {
  const a = (Math.PI * i) / 14 - Math.PI / 2;
  const r = i % 2 === 0 ? 50 : 41;
  return `${(50 + r * Math.cos(a)).toFixed(1)}% ${(50 + r * Math.sin(a)).toFixed(1)}%`;
}).join(', ')})`;

function anim(name: string, delay = 0, offset = 0): CSSProperties {
  return { animationName: name, animationDelay: `${(delay + offset).toFixed(2)}s` };
}

function keyOf(word: string) {
  return word.toLowerCase().replace(/[^a-z0-9%]/g, '');
}

/** Kata yang ditandai generator (harga, diskon, produk) diberi warna aksen, sama seperti di kanvas. */
function Emphasis({ text, keys, color }: { text: string; keys: string[]; color: string }) {
  const set = new Set(keys);
  return (
    <>
      {text.split(/(\s+)/).map((part, i) =>
        set.has(keyOf(part)) ? (
          <span key={i} style={{ color }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function PhoneFrame({
  children,
  className = '',
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <figure className={`mk-glass rounded-[30px] p-[6px] ${className}`} aria-label={label}>
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[24px]">{children}</div>
    </figure>
  );
}

function Dots({ active, color, idle }: { active: number; color: string; idle: string }) {
  return (
    <div className="absolute bottom-3 left-3.5 flex gap-1" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="h-[5px] rounded-full"
          style={{ width: i === active ? 18 : 5, background: i === active ? color : idle }}
        />
      ))}
    </div>
  );
}

export function PromoPhone(props: {
  badge: string;
  title: string;
  emphasis: string[];
  sub: string;
  store: string;
  product: string;
  normal: string;
  price: string;
  sticker: string;
  offset?: number;
}) {
  const o = props.offset || 0;
  return (
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(160deg, #fff1c1 0%, #ffe08a 55%, #ffc94d 100%)' }}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            'repeating-conic-gradient(from 0deg at 50% 36%, rgba(255,255,255,0.55) 0deg 9deg, transparent 9deg 18deg)',
        }}
        aria-hidden
      />
      <div className="relative flex h-full flex-col p-[9%]">
        <span className="self-start rounded-full bg-white/90 px-2 py-[3px] text-[0.56em] font-bold text-[#b91c1c]">
          {props.badge}
        </span>
        <p className="mk-loop mt-[6%] text-[1.12em] font-extrabold leading-[1.12] text-[#1c1206]" style={anim('mk-rise', 0.05, o)}>
          <Emphasis text={props.title} keys={props.emphasis} color="#dc2626" />
        </p>
        <p className="mk-loop mt-[3%] text-[0.58em] text-[#5b4310]" style={anim('mk-rise', 0.2, o)}>
          {props.sub}
        </p>
        <div
          className="mk-loop relative mb-[16%] mt-auto rounded-[14px] bg-white p-[8%] shadow-[0_12px_30px_-12px_rgba(120,53,15,0.45)]"
          style={anim('mk-rise', 0.3, o)}
        >
          {props.store && <p className="text-[0.5em] text-[#1c1206]/60">🏪 {props.store}</p>}
          <p className="pr-[34%] text-[0.78em] font-extrabold leading-tight text-[#1c1206]">{props.product}</p>
          {props.normal && (
            <p className="relative mt-[4%] inline-block text-[0.62em] font-semibold text-[#1c1206]/55">
              {props.normal}
              <span
                className="mk-loop absolute left-[-2px] right-[-2px] top-1/2 h-[1.5px] origin-left bg-[#dc2626]"
                style={anim('mk-strike', 0, o)}
              />
            </p>
          )}
          <p
            className="mk-loop origin-left text-[1.75em] font-black leading-none tracking-tight text-[#dc2626]"
            style={anim('mk-pop', 0, o)}
          >
            {props.price}
          </p>
          <span
            className="mk-loop absolute -right-[6%] -top-[18%] grid aspect-square w-[34%] place-items-center bg-[#dc2626] text-center text-[0.5em] font-black leading-[1.05] text-white"
            style={{ ...anim('mk-spin-in', 0, o), clipPath: STARBURST }}
          >
            {props.sticker}
          </span>
        </div>
        <Dots active={2} color="#dc2626" idle="rgba(28,18,6,0.2)" />
      </div>
    </div>
  );
}

export function QuotePhone(props: { badge: string; title: string; quote: string; offset?: number }) {
  const o = props.offset || 0;
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(120% 60% at 50% -5%, rgba(244,194,122,0.22), transparent 60%), linear-gradient(170deg, #0b1026, #151a3a 55%, #241a3d)',
      }}
    >
      <div className="relative flex h-full flex-col p-[9%]">
        <span className="self-start rounded-full bg-[#1e1b3c]/85 px-2 py-[3px] text-[0.56em] font-bold text-[#f4c27a]">
          {props.badge}
        </span>
        <p
          className="mk-loop mt-[6%] text-[1.04em] font-bold leading-[1.18] text-[#f8f5ee]"
          style={{ ...anim('mk-rise', 0.05, o), fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          {props.title}
        </p>
        <div className="mk-loop mb-[16%] mt-auto rounded-[14px] bg-[#faf7f0] p-[9%]" style={anim('mk-rise', 0.25, o)}>
          <span
            className="block text-[2.2em] leading-[0.7] text-[#c08a3e]"
            style={{ fontFamily: 'Georgia, serif' }}
            aria-hidden
          >
            “
          </span>
          <p
            className="mk-loop mt-[4%] text-[0.8em] font-semibold leading-[1.3] text-[#1f1b2e]"
            style={{ ...anim('mk-type', 0, o), fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            {props.quote}
          </p>
          <span className="mk-loop mt-[5%] block h-[2px] w-2/3 origin-left rounded bg-[#c08a3e]" style={anim('mk-draw', 0, o)} />
        </div>
        <Dots active={0} color="#c08a3e" idle="rgba(255,255,255,0.22)" />
      </div>
    </div>
  );
}

export function EdukasiPhone(props: { badge: string; title: string; steps: string[]; offset?: number }) {
  const o = props.offset || 0;
  return (
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(165deg, #d1fae5 0%, #e6fbf3 50%, #ecfeff 100%)' }}
    >
      <svg className="absolute inset-x-0 bottom-0 h-[22%] w-full" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
        <path d="M0 12 Q 25 4 50 12 T 100 12 V30 H0Z" fill="rgba(16,185,129,0.14)" />
        <path d="M0 20 Q 25 12 50 20 T 100 20 V30 H0Z" fill="rgba(255,255,255,0.6)" />
      </svg>
      <div className="relative flex h-full flex-col p-[9%]">
        <span className="self-start rounded-full bg-white/90 px-2 py-[3px] text-[0.56em] font-bold text-[#047857]">
          {props.badge}
        </span>
        <p className="mk-loop mt-[6%] text-[1.06em] font-extrabold leading-[1.14] text-[#064e3b]" style={anim('mk-rise', 0.05, o)}>
          {props.title}
        </p>
        <ol className="mb-[16%] mt-auto space-y-[6%] rounded-[14px] bg-white/95 p-[8%] shadow-[0_12px_30px_-14px_rgba(6,78,59,0.4)]">
          {props.steps.map((step, i) => (
            <li key={step} className="mk-loop flex items-start gap-[6%]" style={anim('mk-rise', 0.35 + i * 0.35, o)}>
              <span className="grid aspect-square w-[1.45em] shrink-0 place-items-center rounded-full bg-[#10b981] text-[0.55em] font-extrabold text-white">
                {i + 1}
              </span>
              <span className="text-[0.6em] font-semibold leading-snug text-[#064e3b]">{step}</span>
            </li>
          ))}
        </ol>
        <Dots active={1} color="#10b981" idle="rgba(6,78,59,0.2)" />
      </div>
    </div>
  );
}
