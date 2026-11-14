'use client';

import Link from 'next/link';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(' ');

/**
 * Tekan seperti gel (GlassBar di Depup Office): permukaan sedikit melebar & memipih ke arah jari dan menyala
 * dari titik sentuh, lalu kembali mulus saat dilepas. Hanya mengubah atribut & variabel CSS di elemennya —
 * tidak memicu render ulang React. Gaya ada di .mk-gel (app/globals.css).
 */
export function useGel<T extends HTMLElement>(ref: React.RefObject<T>) {
  return useMemo(() => {
    const at = (e: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      el.style.setProperty('--gx', `${x}px`);
      el.style.setProperty('--gy', `${e.clientY - r.top}px`);
      return { el, x, w: r.width || 1 };
    };
    const end = () => {
      const el = ref.current;
      if (el) delete el.dataset.press;
    };
    return {
      onPointerDown: (e: React.PointerEvent<T>) => {
        const p = at(e);
        if (!p) return;
        p.el.style.setProperty('--gox', `${50 + (p.x / p.w - 0.5) * 40}%`);
        p.el.dataset.press = '';
      },
      onPointerMove: (e: React.PointerEvent<T>) => {
        if (ref.current && 'press' in ref.current.dataset) at(e);
      },
      onPointerUp: end,
      onPointerCancel: end,
      onPointerLeave: end,
    };
  }, [ref]);
}

export type GlassTab = {
  id: string;
  label: string;
  icon: React.ElementType;
  onSelect?: () => void;
  href?: string;
};

/**
 * Navigasi bawah berbentuk kapsul kaca yang melayang (seperti Depup Office):
 * - kaca blur di HP menengah ke atas, pekat di HP kelas bawah (.mk-bar);
 * - satu pil warna meluncur antar-tab dan sedikit memanjang di tengah jalan (.mk-pill);
 * - tombol aksi bulat di tengah (mis. "Buat video");
 * - kapsul bereaksi seperti gel saat disentuh (.mk-gel).
 */
export function GlassTabBar({
  tabs,
  active,
  action,
  actionAt = 2,
  className,
}: {
  tabs: GlassTab[];
  active: string;
  action?: { href: string; label: string; icon: React.ElementType };
  actionAt?: number;
  className?: string;
}) {
  const bar = useRef<HTMLElement>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const [morph, setMorph] = useState(0);
  const seen = useRef<string | null>(null);
  const gel = useGel(bar);

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[active];
      setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
    };
    measure();
    if (seen.current !== null && seen.current !== active) setMorph((m) => m + 1);
    seen.current = active;
    if (typeof ResizeObserver === 'undefined' || !bar.current) return;
    const ro = new ResizeObserver(measure);
    ro.observe(bar.current);
    return () => ro.disconnect();
  }, [active]);

  const items: React.ReactNode[] = tabs.map((t) => {
    const on = t.id === active;
    const cls = cx(
      'mk-squish relative z-[1] flex h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10.5px] font-bold',
      on ? 'text-white' : 'text-[#433B5C]'
    );
    const body = (
      <>
        <t.icon className="h-5 w-5" aria-hidden />
        <span className="max-w-full truncate px-1">{t.label}</span>
      </>
    );
    return t.href ? (
      <Link key={t.id} href={t.href} ref={(el) => void (refs.current[t.id] = el)} className={cls} aria-current={on ? 'page' : undefined}>
        {body}
      </Link>
    ) : (
      <button key={t.id} type="button" ref={(el) => void (refs.current[t.id] = el)} onClick={t.onSelect} className={cls} aria-current={on ? 'page' : undefined}>
        {body}
      </button>
    );
  });
  if (action) {
    items.splice(
      Math.min(actionAt, items.length),
      0,
      <Link
        key="__action"
        href={action.href}
        aria-label={action.label}
        title={action.label}
        className="mk-squish relative z-[1] mx-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mk-lime text-mk-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_20px_-8px_rgba(120,160,10,0.9)]"
      >
        <action.icon className="h-6 w-6" aria-hidden />
      </Link>
    );
  }

  return (
    <nav
      ref={bar}
      {...gel}
      aria-label="Navigasi utama"
      className={cx(
        'mk-glass mk-bar mk-float mk-gel fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-40 mx-auto flex h-16 max-w-md touch-manipulation items-center rounded-[30px] px-1.5',
        className
      )}
    >
      {pill && (
        <span aria-hidden className="mk-pill" style={{ width: pill.w, transform: `translateX(${pill.x}px)` }}>
          <i key={morph} className={morph ? 'mk-morph' : undefined} />
        </span>
      )}
      {items}
    </nav>
  );
}
