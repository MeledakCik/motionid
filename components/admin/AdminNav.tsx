'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, FlaskConical, Plug, ExternalLink } from 'lucide-react';
import { cx } from '@/components/studio/ui';

const ITEMS = [
  { href: '/admin', label: 'Training Studio', short: 'Training', icon: Brain, hint: 'Bank pack & teks' },
  { href: '/admin/research', label: 'Motion Lab', short: 'Riset', icon: FlaskConical, hint: 'Riset gerak mendalam' },
  { href: '/admin/mcp', label: 'MCP Connector', short: 'MCP', icon: Plug, hint: 'Hubungkan asisten AI' },
];

export default function AdminNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cx('mk-noscroll flex items-center gap-1.5 overflow-x-auto', className)} aria-label="Navigasi admin">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.hint}
            className={cx('mk-chip shrink-0 px-3.5 py-2 text-xs', active && 'mk-chip-on')}
            aria-current={active ? 'page' : undefined}
          >
            <item.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.short}</span>
          </Link>
        );
      })}
      <Link href="/editor" className="mk-chip shrink-0 px-3.5 py-2 text-xs" title="Buka editor untuk menguji pack">
        <ExternalLink className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Editor uji</span>
        <span className="sm:hidden">Editor</span>
      </Link>
    </nav>
  );
}
