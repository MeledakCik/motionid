'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

export function Section({ title, children, right, className }: { title?: string; children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cx('space-y-2.5 border-b border-mk-line px-4 py-3.5 last:border-b-0', className)}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-2">
          {title && <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-mk-muted">{title}</h4>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-mk-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-mk-dim">{hint}</span>}
    </label>
  );
}

export function NumberField({ label, value, onChange, step = 1, min, max, suffix }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string }) {
  const [draft, setDraft] = useState(String(Math.round(value * 100) / 100));
  useEffect(() => setDraft(String(Math.round(value * 100) / 100)), [value]);
  return (
    <label className="flex items-center gap-1.5 rounded-lg border border-mk-line bg-mk-ink px-2 py-1.5">
      <span className="w-5 shrink-0 text-[11px] font-bold text-mk-dim">{label}</span>
      <input
        inputMode="decimal"
        className="w-full min-w-0 bg-transparent text-xs font-semibold text-mk-cream outline-none"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          let v = Number(draft.replace(',', '.'));
          if (!Number.isFinite(v)) return setDraft(String(value));
          if (min !== undefined) v = Math.max(min, v);
          if (max !== undefined) v = Math.min(max, v);
          onChange(v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(value + (e.key === 'ArrowUp' ? step : -step) * (e.shiftKey ? 10 : 1));
          }
        }}
      />
      {suffix && <span className="text-[11px] text-mk-dim">{suffix}</span>}
    </label>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, onCommit, format }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; onCommit?: () => void; format?: (v: number) => string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-semibold text-mk-muted">
        <span>{label}</span>
        <span className="tabular-nums text-mk-cream">{format ? format(value) : Math.round(value * 100) / 100}</span>
      </div>
      <input
        type="range"
        className="mk-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        onTouchEnd={onCommit}
      />
    </div>
  );
}

export function ColorField({ label, value, onChange, swatches }: { label: string; value: string; onChange: (v: string) => void; swatches?: string[] }) {
  const safe = /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff';
  return (
    <div>
      <span className="mb-1 block text-[11px] font-semibold text-mk-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <input type="color" className="mk-color" value={safe} onChange={(e) => onChange(e.target.value)} aria-label={label} />
        {(swatches || []).slice(0, 8).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cx('h-7 w-7 rounded-lg border-2 transition', value.toLowerCase() === c.toLowerCase() ? 'border-mk-cream' : 'border-transparent')}
            style={{ background: c }}
            aria-label={`Warna ${c}`}
          />
        ))}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: { value: T; options: Array<{ value: T; label: React.ReactNode; title?: string }>; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="flex rounded-xl border border-mk-line bg-mk-ink p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex flex-1 items-center justify-center gap-1 rounded-lg font-bold transition',
            size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs',
            value === o.value ? 'bg-mk-panel-3 text-mk-cream shadow' : 'text-mk-dim hover:text-mk-cream'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mk-input py-2 text-xs"
    />
  );
}

export function ChipRow<T extends string>({ value, options, onChange }: { value: T; options: Array<{ id: T; label: string }>; onChange: (v: T) => void }) {
  return (
    <div className="mk-noscroll -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5">
      {options.map((o) => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)} className={cx('mk-chip shrink-0', value === o.id && 'mk-chip-on')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Bottom sheet untuk HP (gaya CapCut). */
export function BottomSheet({ open, onClose, title, children, tall }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; tall?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden" role="dialog" aria-label={title}>
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cx('relative flex animate-mk-sheet flex-col rounded-t-3xl border-t border-mk-line bg-mk-panel shadow-2xl', tall ? 'h-[78vh]' : 'max-h-[64vh]')}>
        <div className="flex items-center justify-between px-4 pb-1 pt-2.5">
          <div className="mx-auto h-1 w-10 rounded-full bg-mk-line-2" />
        </div>
        <div className="flex items-center justify-between px-4 pb-2">
          <h3 className="text-sm font-extrabold">{title}</h3>
          <button type="button" className="mk-btn-icon" onClick={onClose} aria-label="Tutup panel">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mk-scroll min-h-0 flex-1 overflow-y-auto pb-[max(env(safe-area-inset-bottom),12px)]">{children}</div>
      </div>
    </div>
  );
}

/** Render anak hanya saat terlihat (hemat CPU HP). */
export function LazyVisible({ children, className, minH = 80 }: { children: React.ReactNode; className?: string; minH?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || vis) return;
    if (typeof IntersectionObserver === 'undefined') return setVis(true);
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setVis(true), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, [vis]);
  return (
    <div ref={ref} className={className} style={{ minHeight: vis ? undefined : minH }}>
      {vis ? children : null}
    </div>
  );
}

export function useMediaQuery(q: string): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, [q]);
  return m;
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2 font-extrabold tracking-tight', className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-mk-grad text-mk-ink shadow-mk-glow">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" width="18" height="18" fill="currentColor" aria-hidden>
          <path d="M7 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L8.5 4.64A1 1 0 0 0 7 5.5Z" />
        </svg>
      </span>
      <span>
        Motion<span className="text-mk-coral">Ku</span>
      </span>
    </span>
  );
}

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  desc?: string;
  icon?: React.ReactNode;
}

/** Dropdown bergaya MotionKu (pengganti <select> bawaan browser). */
export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  label,
  compactLabel,
  className,
  menuWidth = 240,
  align = 'left',
}: {
  value: T;
  options: Array<DropdownOption<T>>;
  onChange: (v: T) => void;
  label?: string;
  /** teks tombol yang lebih pendek (mis. di HP) */
  compactLabel?: (o: DropdownOption<T>) => React.ReactNode;
  className?: string;
  menuWidth?: number;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; up: boolean }>({ top: 0, left: 0, width: menuWidth, up: false });
  const [hi, setHi] = useState(0);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const cur = options.find((o) => o.value === value) || options[0];

  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(Math.max(menuWidth, r.width), window.innerWidth - 16);
    let left = align === 'right' ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    const estH = Math.min(360, options.length * 52 + 12);
    const up = r.bottom + estH > window.innerHeight - 8 && r.top > estH;
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left, width: w, up });
  };

  useEffect(() => {
    if (!open) return;
    place();
    setHi(Math.max(0, options.findIndex((o) => o.value === value)));
    const close = (e: Event) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      else if (e.key === 'ArrowDown') (e.preventDefault(), setHi((h) => Math.min(options.length - 1, h + 1)));
      else if (e.key === 'ArrowUp') (e.preventDefault(), setHi((h) => Math.max(0, h - 1)));
      else if (e.key === 'Enter') {
        e.preventDefault();
        setHi((h) => {
          onChange(options[h].value);
          return h;
        });
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          'inline-flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition',
          open ? 'border-mk-coral bg-mk-panel-3 ring-2 ring-mk-coral/20' : 'border-mk-line bg-mk-panel-2 hover:border-mk-line-2',
          className
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {cur?.icon}
          <span className="truncate">{compactLabel ? compactLabel(cur) : cur?.label}</span>
        </span>
        <svg viewBox="0 0 24 24" width="14" height="14" className={cx('shrink-0 text-mk-muted transition', open && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          ref={menu}
          role="listbox"
          className="mk-scroll fixed z-[80] max-h-[360px] animate-mk-up overflow-y-auto rounded-2xl border border-mk-line-2 bg-mk-panel p-1.5 shadow-2xl"
          style={{ left: pos.left, width: pos.width, ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }) }}
        >
          {label && <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-extrabold uppercase tracking-wider text-mk-dim">{label}</div>}
          {options.map((o, i) => {
            const sel = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={sel}
                onMouseEnter={() => setHi(i)}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cx('flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition', sel ? 'bg-mk-coral/15' : i === hi ? 'bg-mk-panel-3' : '')}
              >
                {o.icon && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mk-ink text-mk-cream">{o.icon}</span>}
                <span className="min-w-0 flex-1">
                  <span className={cx('block truncate text-sm font-bold', sel ? 'text-mk-coral' : 'text-mk-cream')}>{o.label}</span>
                  {o.desc && <span className="block truncate text-[11px] text-mk-dim">{o.desc}</span>}
                </span>
                {sel && (
                  <svg viewBox="0 0 24 24" width="16" height="16" className="shrink-0 text-mk-coral" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/** Ikon kecil bentuk rasio video. */
export function RatioIcon({ ratio }: { ratio: string }) {
  const [a, b] = ratio.split(':').map(Number);
  const s = 18 / Math.max(a, b);
  return <span className="inline-block rounded-[3px] border-2 border-current" style={{ width: Math.max(6, a * s), height: Math.max(6, b * s) }} />;
}
