import React from 'react';

export interface DynamicMotionSceneProps {
  stepBadge: string;
  title: string;
  subtext: string;
  widgetType: 'repo_input_card' | 'repo_scanner_card' | 'terminal_build_card' | 'bento_metrics_grid';
  primaryInput?: string;
  secondaryBadge?: string;
  terminalLines?: string[];
  paletteId?: 'depup-lavender' | 'midnight-indigo' | 'aurora-mint' | 'sunset-coral';
  progress?: number; // 0..1 normalized scene progress
  fontFamily?: string;
}

const PALETTES: Record<string, { bg: string; orb1: string; orb2: string; text: string; sub: string; pillBg: string; pillText: string }> = {
  'depup-lavender': {
    bg: 'linear-gradient(160deg, #dcd6f7 0%, #ede9fe 52%, #f5f3ff 100%)',
    orb1: 'radial-gradient(circle, rgba(163, 230, 53, 0.55) 0%, rgba(163, 230, 53, 0) 70%)',
    orb2: 'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, rgba(168, 85, 247, 0) 70%)',
    text: '#18181b',
    sub: '#52525b',
    pillBg: 'rgba(255, 255, 255, 0.85)',
    pillText: '#4f46e5',
  },
  'midnight-indigo': {
    bg: 'linear-gradient(160deg, #090d16 0%, #111827 55%, #1e1b4b 100%)',
    orb1: 'radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, rgba(99, 102, 241, 0) 70%)',
    orb2: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0) 70%)',
    text: '#f8fafc',
    sub: '#94a3b8',
    pillBg: 'rgba(30, 41, 59, 0.85)',
    pillText: '#818cf8',
  },
};

export const DynamicMotionTemplate: React.FC<DynamicMotionSceneProps> = ({
  stepBadge,
  title,
  subtext,
  widgetType,
  primaryInput = 'github.com/dimas/api',
  secondaryBadge = 'Auto-Detect Framework',
  terminalLines = [
    '$ git clone https://github.com/dimas/api',
    '$ npm install --production',
    '✓ Deployed without the hassle 🚀',
  ],
  paletteId = 'depup-lavender',
  progress = 0.5,
  fontFamily = 'Plus Jakarta Sans, Inter, sans-serif',
}) => {
  const pal = PALETTES[paletteId] || PALETTES['depup-lavender'];
  const springY = Math.max(0, 1 - Math.min(1, progress * 3.2)) * 28;
  const cardTilt = Math.sin(progress * Math.PI * 2) * 2.2;

  return (
    <div
      className="relative w-full h-full flex flex-col justify-between p-7 overflow-hidden select-none"
      style={{ background: pal.bg, fontFamily }}
    >
      {/* Organic Lime/Yellow & Lavender Ambient Orbs (@depup.web signature look) */}
      <div
        className="absolute -top-16 -right-12 w-64 h-64 rounded-full pointer-events-none transition-transform duration-300"
        style={{
          background: pal.orb1,
          transform: `translate(${Math.sin(progress * 6) * 10}px, ${Math.cos(progress * 6) * 10}px) scale(${1 + progress * 0.15})`,
        }}
      />
      <div
        className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: pal.orb2 }}
      />

      {/* Top Numbered Step Pill & Clean Sans-Serif Header */}
      <div
        className="relative z-10 mt-6 space-y-2.5 text-left"
        style={{ transform: `translateY(${springY}px)` }}
      >
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm border border-black/5 backdrop-blur-md"
          style={{ background: pal.pillBg, color: pal.pillText }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>{stepBadge}</span>
        </div>
        <h2
          className="text-3xl font-extrabold tracking-tight leading-tight"
          style={{ color: pal.text }}
        >
          {title}
        </h2>
        <p className="text-sm font-medium leading-relaxed max-w-xs" style={{ color: pal.sub }}>
          {subtext}
        </p>
      </div>

      {/* Interactive Motion Graphic UI Mockup Card */}
      <div
        className="relative z-10 my-auto"
        style={{
          transform: `perspective(800px) rotateX(${cardTilt}deg) translateY(${springY * 0.8}px)`,
        }}
      >
        {widgetType === 'repo_input_card' && (
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 shadow-xl border border-white/80 flex gap-3 items-center">
            <div className="flex flex-col gap-2 pr-2 border-r border-slate-100 text-slate-400">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                ⌘
              </div>
              <div className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center text-xs">
                ⚡
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Repository URL
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs font-mono text-slate-800 flex items-center justify-between">
                <span>{primaryInput}</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-sans font-semibold">
                  Import
                </span>
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">{secondaryBadge}</div>
            </div>
          </div>
        )}

        {widgetType === 'repo_scanner_card' && (
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 shadow-xl border border-white/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">{primaryInput}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                Optimal
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-2xl bg-indigo-50/70 text-left">
                <div className="text-[10px] text-slate-500">Runtime</div>
                <div className="text-xs font-bold text-indigo-950">Node 20</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-emerald-50/70 text-left">
                <div className="text-[10px] text-slate-500">Region</div>
                <div className="text-xs font-bold text-emerald-950">SIN-1</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-purple-50/70 text-left">
                <div className="text-[10px] text-slate-500">Preset</div>
                <div className="text-xs font-bold text-purple-950">Zero-Cfg</div>
              </div>
            </div>
          </div>
        )}

        {widgetType === 'terminal_build_card' && (
          <div className="bg-slate-950 text-slate-100 rounded-3xl p-4 shadow-2xl border border-slate-800 font-mono text-left space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400">build-runner — zsh</span>
            </div>
            <div className="space-y-1.5 text-[11px] leading-relaxed">
              {terminalLines.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith('✓') || line.startsWith('🚀')
                      ? 'text-emerald-400 font-semibold'
                      : 'text-slate-300'
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Progress Pill Indicator */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-semibold opacity-75" style={{ color: pal.sub }}>
        <span>MotionID Engine v4.0</span>
        <div className="w-24 h-1.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-150"
            style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
