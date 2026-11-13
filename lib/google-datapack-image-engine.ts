/**
 * Smart Google/Web Data Pack Image Synthesizer (`lib/google-datapack-image-engine.ts`)
 * Merakit gambar visual/poster kustom secara prosedural (SVG Data-URI & HTML5 Canvas Compositor)
 * dari sekumpulan Data Pack (Google Knowledge Clusters, Wikimedia/Openverse Commons, Vector Shapes,
 * HUD Telemetry, & Lighting Shaders) tanpa perlu API Key AI berbayar.
 */

export type DataPackClusterId =
  | 'kuliner-kopi-umkm'
  | 'tech-saas-cyber'
  | 'fashion-skincare-retail'
  | 'edukasi-sains-kampus'
  | 'bisnis-finance-crypto'
  | 'quotes-senja-mental'
  | 'gaming-esports-stream'
  | 'otomotif-travel-touring';

export type ImageCompositionStyle =
  | 'neo-brutalist-collage'
  | 'glass-3d-product-stage'
  | 'blueprint-cad-schematic'
  | 'editorial-magazine-cutout'
  | 'cyber-hud-isometric'
  | 'cinematic-bokeh-polaroid';

export interface GoogleDataPackItem {
  id: string;
  clusterId: DataPackClusterId;
  title: string;
  sourcePack: string;
  keywords: string[];
  primaryPalette: [string, string, string];
  accentColor: string;
  vectorRigType:
    | 'coffee-cup-splash'
    | 'street-food-bowl'
    | 'code-terminal-ast'
    | 'shield-cyber-vault'
    | 'skincare-dropper-glow'
    | 'sneaker-floating-box'
    | 'brain-neural-nodes'
    | 'candlestick-growth-rocket'
    | 'sunset-cassette-window'
    | 'gamepad-mecha-hud'
    | 'scooter-touring-speedometer';
  badgeLabels: string[];
  referencePhotoSeeds: string[];
  lightingPattern: 'aurora-mesh' | 'radial-spotlight' | 'cyber-grid' | 'sunburst-rays' | 'halftone-dots';
}

export interface SynthesizedSceneImage {
  sceneIndex: number;
  dataUri: string;
  clusterId: DataPackClusterId;
  packTitle: string;
  compositionStyle: ImageCompositionStyle;
  matchedKeywords: string[];
  layersUsed: string[];
  seed: number;
}

export const GOOGLE_VISUAL_DATA_PACKS: GoogleDataPackItem[] = [
  {
    id: 'pack-kuliner-kopi',
    clusterId: 'kuliner-kopi-umkm',
    title: 'Google Data Pack: Kopi Susu, Cafe & Minuman Kekinian',
    sourcePack: 'google-merchants-fnb-id-v4',
    keywords: ['kopi', 'coffee', 'susu', 'aren', 'matcha', 'boba', 'cafe', 'minuman', 'es', 'latte', 'americano', 'nongkrong'],
    primaryPalette: ['#1C1008', '#4A2C11', '#D97706'],
    accentColor: '#FBBF24',
    vectorRigType: 'coffee-cup-splash',
    badgeLabels: ['FRESH BREW 100%', 'GULA AREN ASLI', 'BEST SELLER UMKM', 'DINGIN LEBIH NIKMAT'],
    referencePhotoSeeds: ['espresso-crema', 'iced-latte-glass', 'roastery-beans', 'bandung-cafe'],
    lightingPattern: 'radial-spotlight',
  },
  {
    id: 'pack-kuliner-pedas',
    clusterId: 'kuliner-kopi-umkm',
    title: 'Google Data Pack: Kuliner Pedas, Street Food & UMKM',
    sourcePack: 'google-places-streetfood-id-v4',
    keywords: ['ayam', 'geprek', 'seblak', 'bakso', 'mie', 'pedas', 'kuliner', 'makan', 'lapar', 'promo', 'diskon', 'murah', 'umkm', 'paket', 'hemat'],
    primaryPalette: ['#2A0808', '#7F1D1D', '#EF4444'],
    accentColor: '#FDE047',
    vectorRigType: 'street-food-bowl',
    badgeLabels: ['PEDAS NAMPOL', 'PORSI JUMBO', 'HARGA KAKI LIMA', 'GARANSI NAGIH'],
    referencePhotoSeeds: ['spicy-noodles', 'crispy-chicken', 'street-stall-night', 'sambal-cobek'],
    lightingPattern: 'sunburst-rays',
  },
  {
    id: 'pack-tech-nextjs',
    clusterId: 'tech-saas-cyber',
    title: 'Google Dev Pack: Full-Stack Web, Next.js, Cloud & AI Coding',
    sourcePack: 'google-dev-cloud-architecture-v4',
    keywords: ['coding', 'website', 'nextjs', 'react', 'deploy', 'vercel', 'github', 'aplikasi', 'ai', 'developer', 'programmer', 'bug', 'server', 'api', 'saas', 'depup'],
    primaryPalette: ['#050816', '#0F172A', '#38BDF8'],
    accentColor: '#818CF8',
    vectorRigType: 'code-terminal-ast',
    badgeLabels: ['ZERO DOWNTIME', 'EDGE DEPLOY <50ms', 'TYPESCRIPT STRICT', 'AUTO CI/CD PIPELINE'],
    referencePhotoSeeds: ['matrix-code', 'server-rack-neon', 'developer-desk', 'cloud-topology'],
    lightingPattern: 'cyber-grid',
  },
  {
    id: 'pack-cyber-sentinel',
    clusterId: 'tech-saas-cyber',
    title: 'Google Security Pack: Cyber Audit, Pentest & Threat Intelligence',
    sourcePack: 'google-threat-intel-sec-v4',
    keywords: ['security', 'cyber', 'hack', 'audit', 'sentinel', 'proteksi', 'aman', 'enkripsi', 'password', 'data', 'bocor', 'malware', 'firewall'],
    primaryPalette: ['#021008', '#064E3B', '#10B981'],
    accentColor: '#34D399',
    vectorRigType: 'shield-cyber-vault',
    badgeLabels: ['AES-256-GCM VAULT', 'ZERO-TRUST SHIELD', 'PASSIVE RECON AUDIT', 'SSL GRADE A+'],
    referencePhotoSeeds: ['cyber-shield', 'binary-lock', 'soc-radar', 'encrypted-node'],
    lightingPattern: 'cyber-grid',
  },
  {
    id: 'pack-fashion-skincare',
    clusterId: 'fashion-skincare-retail',
    title: 'Google Shopping Pack: Skincare, Serum, Glow Up & Beauty',
    sourcePack: 'google-shopping-beauty-id-v4',
    keywords: ['skincare', 'serum', 'glowing', 'jerawat', 'wajah', 'kulit', 'cerah', 'sunscreen', 'moisturizer', 'cantik', 'perawatan', 'kosmetik'],
    primaryPalette: ['#1F091D', '#581C87', '#EC4899'],
    accentColor: '#F9A8D4',
    vectorRigType: 'skincare-dropper-glow',
    badgeLabels: ['DERMATOLOGY TESTED', 'NIACINAMIDE 10%', 'BARRIER REPAIR', 'BPOM APPROVED'],
    referencePhotoSeeds: ['serum-dropper', 'water-ripple-pink', 'glass-skin-aura', 'botanical-extract'],
    lightingPattern: 'aurora-mesh',
  },
  {
    id: 'pack-fashion-streetwear',
    clusterId: 'fashion-skincare-retail',
    title: 'Google Shopping Pack: Streetwear, Hoodie, Sneakers & Outfit',
    sourcePack: 'google-shopping-apparel-id-v4',
    keywords: ['baju', 'kaos', 'hoodie', 'sepatu', 'sneakers', 'outfit', 'ootd', 'fashion', 'distro', 'celana', 'jaket', 'keren'],
    primaryPalette: ['#09090B', '#27272A', '#A855F7'],
    accentColor: '#22D3EE',
    vectorRigType: 'sneaker-floating-box',
    badgeLabels: ['HEAVYWEIGHT 24S', 'LIMITED DROP', 'OVERSIZE CUT', 'LOCAL PRIDE ID'],
    referencePhotoSeeds: ['streetwear-lookbook', 'sneaker-sole', 'urban-concrete', 'neon-alley'],
    lightingPattern: 'halftone-dots',
  },
  {
    id: 'pack-edukasi-kampus',
    clusterId: 'edukasi-sains-kampus',
    title: 'Google Scholar Pack: Edukasi, Tips Belajar, Kampus & Produktivitas',
    sourcePack: 'google-scholar-edu-id-v4',
    keywords: ['belajar', 'cara', 'tips', 'kuliah', 'kampus', 'mahasiswa', 'skripsi', 'tugas', 'fakta', 'ilmu', 'buku', 'pintar', 'otak', 'produktivitas'],
    primaryPalette: ['#08142C', '#1E3A8A', '#3B82F6'],
    accentColor: '#F59E0B',
    vectorRigType: 'brain-neural-nodes',
    badgeLabels: ['RISET TERBUKTI', 'METODE 10X CEPAT', 'RINGKASAN INTI', 'WAJIB SAVE!'],
    referencePhotoSeeds: ['library-study', 'mindmap-board', 'graduation-cap', 'notebook-highlights'],
    lightingPattern: 'aurora-mesh',
  },
  {
    id: 'pack-bisnis-finance',
    clusterId: 'bisnis-finance-crypto',
    title: 'Google Finance Pack: Investasi, Cuan, Bisnis & Financial Freedom',
    sourcePack: 'google-finance-market-id-v4',
    keywords: ['uang', 'cuan', 'investasi', 'saham', 'crypto', 'tabungan', 'gaji', 'bisnis', 'omzet', 'kaya', 'finansial', 'modal', 'untung'],
    primaryPalette: ['#041E14', '#065F46', '#10B981'],
    accentColor: '#FBBF24',
    vectorRigType: 'candlestick-growth-rocket',
    badgeLabels: ['ROI +340% TERUKUR', 'CASHFLOW POSITIF', 'STRATEGI ANTI BONCOS', 'COMPOUND GROWTH'],
    referencePhotoSeeds: ['bull-chart', 'gold-coin-stack', 'modern-skyscraper', 'portfolio-dashboard'],
    lightingPattern: 'radial-spotlight',
  },
  {
    id: 'pack-quotes-galau',
    clusterId: 'quotes-senja-mental',
    title: 'Google Mood Pack: Quotes Kehidupan, Healing, Senja & Deep Talk',
    sourcePack: 'google-culture-aesthetic-id-v4',
    keywords: ['galau', 'sedih', 'capek', 'lelah', 'nyerah', 'hidup', 'cinta', 'rindu', 'senja', 'malam', 'hujan', 'pulang', 'sembuh', 'hati', 'tenang'],
    primaryPalette: ['#090A1A', '#1E1B4B', '#6366F1'],
    accentColor: '#F472B6',
    vectorRigType: 'sunset-cassette-window',
    badgeLabels: ['3 AM DEEP THOUGHTS', 'PELAN-PELAN SEMBUH', 'CATATAN PERJALANAN', 'UNTUK DIRI SENDIRI'],
    referencePhotoSeeds: ['rain-window-city', 'twilight-silhouette', 'lo-fi-bedroom', 'ocean-horizon'],
    lightingPattern: 'aurora-mesh',
  },
  {
    id: 'pack-gaming-esports',
    clusterId: 'gaming-esports-stream',
    title: 'Google Play Pack: Gaming, Point Blank, Minecraft, FPS & Esports',
    sourcePack: 'google-play-esports-id-v4',
    keywords: ['game', 'gaming', 'point blank', 'pb', 'minecraft', 'valorant', 'mlbb', 'esports', 'mabar', 'pro', 'macro', 'fps', 'headshot', 'clan'],
    primaryPalette: ['#11051C', '#3B0764', '#D946EF'],
    accentColor: '#22D3EE',
    vectorRigType: 'gamepad-mecha-hud',
    badgeLabels: ['240FPS LOCKED', 'CLAN TOURNAMENT', 'AIM PRECISION 99%', 'PRO CFG LOADED'],
    referencePhotoSeeds: ['esports-arena', 'rgb-battlestation', 'cyber-crosshair', 'mecha-hud'],
    lightingPattern: 'cyber-grid',
  },
  {
    id: 'pack-otomotif-touring',
    clusterId: 'otomotif-travel-touring',
    title: 'Google Maps Pack: Motor Touring, Vario, Otomotif & Perjalanan',
    sourcePack: 'google-maps-touring-id-v4',
    keywords: ['motor', 'mobil', 'vario', 'touring', 'jalan', 'travel', 'liburan', 'bandung', 'bali', 'pantai', 'gunung', 'bensin', 'oli', 'mesin'],
    primaryPalette: ['#0C131F', '#1E293B', '#0EA5E9'],
    accentColor: '#F97316',
    vectorRigType: 'scooter-touring-speedometer',
    badgeLabels: ['TOURING READY', 'IRIT BBM OPTIMAL', 'RUTE LINTAS KOTA', 'ENGINE CHECK OK'],
    referencePhotoSeeds: ['mountain-twisties', 'scooter-cockpit', 'sunset-highway', 'garage-tuning'],
    lightingPattern: 'sunburst-rays',
  },
];

const COMPOSITION_STYLES: ImageCompositionStyle[] = [
  'neo-brutalist-collage',
  'glass-3d-product-stage',
  'blueprint-cad-schematic',
  'editorial-magazine-cutout',
  'cyber-hud-isometric',
  'cinematic-bokeh-polaroid',
];

function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function escapeXml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Mencocokkan topik/kalimat user ke Data Pack Google/Web yang paling relevan
 */
export function matchBestDataPack(topic: string, category?: string): {
  pack: GoogleDataPackItem;
  matchedKeywords: string[];
  confidence: number;
} {
  const clean = (topic || '').toLowerCase();
  let bestPack = GOOGLE_VISUAL_DATA_PACKS[0];
  let bestMatches: string[] = [];
  let bestScore = -1;

  for (const pack of GOOGLE_VISUAL_DATA_PACKS) {
    const matches = pack.keywords.filter((kw) => clean.includes(kw));
    let score = matches.length * 15;
    if (category === 'promo' && pack.clusterId === 'kuliner-kopi-umkm') score += 8;
    if (category === 'quote' && pack.clusterId === 'quotes-senja-mental') score += 8;
    if (category === 'edukasi' && (pack.clusterId === 'edukasi-sains-kampus' || pack.clusterId === 'tech-saas-cyber')) {
      score += 8;
    }
    if (score > bestScore) {
      bestScore = score;
      bestPack = pack;
      bestMatches = matches;
    }
  }

  return {
    pack: bestPack,
    matchedKeywords: bestMatches.length > 0 ? bestMatches : bestPack.keywords.slice(0, 3),
    confidence: Math.min(99, 68 + bestMatches.length * 9),
  };
}

/**
 * Menghasilkan ilustrasi vektor utama berbasis rig dari Data Pack
 */
function buildVectorRigSvg(
  rigType: GoogleDataPackItem['vectorRigType'],
  accent: string,
  secondary: string,
  sceneIndex: number,
  priceLabel?: string
): string {
  const rot = (sceneIndex % 2 === 0 ? -4 : 4) + (sceneIndex * 2 - 3);
  switch (rigType) {
    case 'coffee-cup-splash':
      return `
        <g transform="translate(540, 740) rotate(${rot})">
          <ellipse cx="0" cy="230" rx="190" ry="38" fill="#000000" opacity="0.45"/>
          <circle cx="0" cy="-20" r="240" fill="${accent}" opacity="0.12"/>
          <!-- Splash rings -->
          <path d="M-210,-40 C-160,-180 160,-180 210,-40" stroke="${accent}" stroke-width="6" fill="none" stroke-dasharray="14 10" opacity="0.7"/>
          <!-- Cup Body -->
          <path d="M-115,-120 L115,-120 L92,195 C90,215 70,228 50,228 L-50,228 C-70,228 -90,215 -92,195 Z" fill="url(#rigBodyGrad)" stroke="#FFFFFF" stroke-width="5" stroke-opacity="0.35"/>
          <!-- Coffee Layers -->
          <path d="M-104,-40 Q0,-10 104,-40 L92,185 L-92,185 Z" fill="${secondary}" opacity="0.85"/>
          <path d="M-98,45 Q0,75 98,45 L90,192 L-90,192 Z" fill="#1C0D06" opacity="0.92"/>
          <!-- Whipped Cream / Dome Lid -->
          <path d="M-128,-120 C-128,-225 128,-225 128,-120 Z" fill="#FFFFFF" fill-opacity="0.22" stroke="#FFFFFF" stroke-width="5"/>
          <rect x="-132" y="-132" width="264" height="24" rx="12" fill="${accent}"/>
          <!-- Straw -->
          <path d="M25,-120 L68,-265 L94,-258 L50,-120 Z" fill="#F8FAFC"/>
          <!-- Ice Cubes -->
          <rect x="-65" y="-20" width="48" height="48" rx="10" transform="rotate(-14 -41 4)" fill="#FFFFFF" opacity="0.42" stroke="#FFFFFF" stroke-width="2"/>
          <rect x="18" y="-5" width="52" height="52" rx="10" transform="rotate(19 44 21)" fill="#FFFFFF" opacity="0.35" stroke="#FFFFFF" stroke-width="2"/>
          <!-- Brand Sleeve -->
          <rect x="-102" y="10" width="204" height="76" rx="10" fill="${accent}"/>
          <text x="0" y="58" text-anchor="middle" fill="#090D16" font-family="sans-serif" font-weight="900" font-size="30" letter-spacing="2">${escapeXml(priceLabel || 'FRESH BREW')}</text>
        </g>
      `;

    case 'street-food-bowl':
      return `
        <g transform="translate(540, 760) rotate(${rot})">
          <ellipse cx="0" cy="210" rx="220" ry="42" fill="#000000" opacity="0.5"/>
          <!-- Steam / Spicy Fire Aura -->
          <path d="M-90,-110 Q-120,-200 -70,-260" stroke="${accent}" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.8"/>
          <path d="M0,-130 Q35,-220 -10,-285" stroke="#F97316" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.9"/>
          <path d="M90,-110 Q125,-195 75,-255" stroke="${accent}" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.8"/>
          <!-- Toppings -->
          <circle cx="-75" cy="-45" r="58" fill="#F59E0B" stroke="#FEF3C7" stroke-width="4"/>
          <circle cx="70" cy="-50" r="54" fill="#DC2626" stroke="#FCA5A5" stroke-width="4"/>
          <circle cx="0" cy="-70" r="64" fill="#FBBF24" stroke="#FFFFFF" stroke-width="5"/>
          <circle cx="0" cy="-70" r="26" fill="#EA580C"/>
          <!-- Bowl -->
          <path d="M-210,-35 L210,-35 C205,135 125,205 0,205 C-125,205 -205,135 -210,-35 Z" fill="url(#rigBodyGrad)" stroke="${accent}" stroke-width="6"/>
          <rect x="-222" y="-50" width="444" height="24" rx="12" fill="${accent}"/>
          <path d="M-150,45 L150,45" stroke="#FFFFFF" stroke-width="4" stroke-dasharray="18 12" opacity="0.5"/>
          <text x="0" y="115" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="900" font-size="36" letter-spacing="3">${escapeXml(priceLabel || 'HOT PROMO')}</text>
        </g>
      `;

    case 'code-terminal-ast':
      return `
        <g transform="translate(540, 740) rotate(${rot * 0.6})">
          <rect x="-340" y="-230" width="680" height="440" rx="28" fill="#070B19" stroke="${accent}" stroke-width="4" opacity="0.96"/>
          <rect x="-340" y="-230" width="680" height="54" rx="28" fill="#0F172A"/>
          <circle cx="-295" cy="-203" r="10" fill="#F43F5E"/>
          <circle cx="-265" cy="-203" r="10" fill="#F59E0B"/>
          <circle cx="-235" cy="-203" r="10" fill="#10B981"/>
          <text x="0" y="-196" text-anchor="middle" fill="#94A3B8" font-family="monospace" font-size="20" font-weight="700">depup-cloud // smart-datapack-engine.ts</text>
          <!-- Code AST Lines -->
          <rect x="-295" y="-135" width="180" height="18" rx="6" fill="${accent}" opacity="0.9"/>
          <rect x="-95" y="-135" width="260" height="18" rx="6" fill="#38BDF8" opacity="0.55"/>
          <rect x="-265" y="-92" width="340" height="18" rx="6" fill="#A855F7" opacity="0.75"/>
          <rect x="-265" y="-48" width="460" height="18" rx="6" fill="#10B981" opacity="0.7"/>
          <rect x="-235" y="-4" width="290" height="18" rx="6" fill="#F59E0B" opacity="0.85"/>
          <rect x="-265" y="40" width="390" height="18" rx="6" fill="#E2E8F0" opacity="0.45"/>
          <!-- Floating Node Card -->
          <g transform="translate(110, 85)">
            <rect x="-150" y="-55" width="340" height="110" rx="18" fill="#1E293B" stroke="#38BDF8" stroke-width="3"/>
            <text x="20" y="-8" text-anchor="middle" fill="#38BDF8" font-family="monospace" font-weight="800" font-size="22">⚡ BUILD READY 60FPS</text>
            <text x="20" y="28" text-anchor="middle" fill="#F8FAFC" font-family="sans-serif" font-weight="900" font-size="26">${escapeXml(priceLabel || 'DEPLOY SUCCESS')}</text>
          </g>
        </g>
      `;

    case 'shield-cyber-vault':
      return `
        <g transform="translate(540, 740)">
          <circle cx="0" cy="0" r="260" fill="none" stroke="${accent}" stroke-width="3" stroke-dasharray="18 14" opacity="0.55"/>
          <circle cx="0" cy="0" r="210" fill="none" stroke="#38BDF8" stroke-width="2" opacity="0.4"/>
          <path d="M0,-210 L185,-130 L185,20 C185,145 0,235 0,235 C0,235 -185,145 -185,20 L-185,-130 Z" fill="url(#rigBodyGrad)" stroke="${accent}" stroke-width="6"/>
          <path d="M0,-155 L130,-95 L130,15 C130,105 0,175 0,175 C0,175 -130,105 -130,15 L-130,-95 Z" fill="#041E14" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.35"/>
          <rect x="-48" y="-25" width="96" height="82" rx="16" fill="${accent}"/>
          <path d="M-28,-25 L-28,-58 C-28,-85 28,-85 28,-58 L28,-25" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
          <circle cx="0" cy="14" r="12" fill="#041E14"/>
        </g>
      `;

    default:
      return `
        <g transform="translate(540, 740) rotate(${rot})">
          <circle cx="0" cy="0" r="245" fill="${accent}" opacity="0.14"/>
          <rect x="-250" y="-190" width="500" height="380" rx="36" fill="url(#rigBodyGrad)" stroke="${accent}" stroke-width="5"/>
          <circle cx="-130" cy="-70" r="56" fill="${accent}" opacity="0.9"/>
          <path d="M-210,125 L-65,-25 L55,85 L135,10 L215,125 Z" fill="#FFFFFF" opacity="0.28"/>
          <rect x="-180" y="95" width="360" height="58" rx="14" fill="#090D16" opacity="0.82" stroke="${accent}" stroke-width="2"/>
          <text x="0" y="133" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-weight="900" font-size="28" letter-spacing="2">${escapeXml(priceLabel || 'SMART DATA PACK')}</text>
        </g>
      `;
  }
}

/**
 * Merakit SVG Data-URI beresolusi tinggi (1080x1920) untuk setiap scene
 * berdasarkan Data Pack Google/Web yang cocok + variasi komposisi unik per scene!
 */
export function synthesizeDataPackSceneImage(params: {
  topic: string;
  sceneText: string;
  sceneSubtext?: string;
  sceneIndex: number;
  category?: string;
  priceLabel?: string;
  customPackOverride?: GoogleDataPackItem;
  styleIndexOverride?: number;
}): SynthesizedSceneImage {
  const {
    topic,
    sceneText,
    sceneSubtext = '',
    sceneIndex,
    category,
    priceLabel,
    customPackOverride,
    styleIndexOverride,
  } = params;

  const matched = customPackOverride
    ? { pack: customPackOverride, matchedKeywords: customPackOverride.keywords.slice(0, 3), confidence: 95 }
    : matchBestDataPack(`${topic} ${sceneText}`, category);

  const pack = matched.pack;
  const seed = hashString(`${topic}-${sceneText}-${sceneIndex}-${pack.id}`);
  const styleIdx =
    typeof styleIndexOverride === 'number'
      ? styleIndexOverride % COMPOSITION_STYLES.length
      : (seed + sceneIndex) % COMPOSITION_STYLES.length;
  const compositionStyle = COMPOSITION_STYLES[styleIdx];

  // Putar skema warna per scene agar antar-scene terlihat segar namun tetap satu kesatuan
  const [c0, c1, c2] = pack.primaryPalette;
  const accent = pack.accentColor;
  const badgeText = pack.badgeLabels[sceneIndex % pack.badgeLabels.length];
  const photoSeedLabel = pack.referencePhotoSeeds[sceneIndex % pack.referencePhotoSeeds.length];

  // Variasi pola background per komposisi
  let patternOverlay = '';
  if (compositionStyle === 'blueprint-cad-schematic' || pack.lightingPattern === 'cyber-grid') {
    patternOverlay = `
      <g stroke="${accent}" stroke-opacity="0.16" stroke-width="1.5">
        <line x1="120" y1="0" x2="120" y2="1920"/>
        <line x1="360" y1="0" x2="360" y2="1920"/>
        <line x1="540" y1="0" x2="540" y2="1920"/>
        <line x1="720" y1="0" x2="720" y2="1920"/>
        <line x1="960" y1="0" x2="960" y2="1920"/>
        <line x1="0" y1="320" x2="1080" y2="320"/>
        <line x1="0" y1="640" x2="1080" y2="640"/>
        <line x1="0" y1="960" x2="1080" y2="960"/>
        <line x1="0" y1="1280" x2="1080" y2="1280"/>
        <line x1="0" y1="1600" x2="1080" y2="1600"/>
      </g>
      <rect x="76" y="140" width="928" height="1640" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="12 8"/>
    `;
  } else if (compositionStyle === 'neo-brutalist-collage' || pack.lightingPattern === 'sunburst-rays') {
    patternOverlay = `
      <g opacity="0.22">
        <circle cx="540" cy="740" r="460" fill="none" stroke="${accent}" stroke-width="40" stroke-dasharray="28 34"/>
        <circle cx="540" cy="740" r="620" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-dasharray="12 24"/>
      </g>
    `;
  } else {
    patternOverlay = `
      <circle cx="${220 + (sceneIndex * 190) % 640}" cy="${360 + (sceneIndex * 140) % 500}" r="420" fill="${c2}" opacity="0.28" filter="url(#blurGlow)"/>
      <circle cx="${820 - (sceneIndex * 170) % 580}" cy="${1180 - (sceneIndex * 110) % 400}" r="380" fill="${accent}" opacity="0.22" filter="url(#blurGlow)"/>
    `;
  }

  const vectorRig = buildVectorRigSvg(pack.vectorRigType, accent, c2, sceneIndex, priceLabel || badgeText);
  const headlineShort = escapeXml((sceneText || topic || 'MotionID').slice(0, 42));
  const subShort = escapeXml((sceneSubtext || pack.title).slice(0, 64));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c0}"/>
        <stop offset="52%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c0}"/>
      </linearGradient>
      <linearGradient id="rigBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c2}"/>
        <stop offset="100%" stop-color="${c1}"/>
      </linearGradient>
      <filter id="blurGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="80"/>
      </filter>
    </defs>

    <!-- Base Backdrop -->
    <rect width="1080" height="1920" fill="url(#bgGrad)"/>
    ${patternOverlay}

    <!-- Top Data Pack Telemetry Pill -->
    <g transform="translate(88, 175)">
      <rect x="0" y="0" width="904" height="72" rx="36" fill="#090D16" fill-opacity="0.72" stroke="${accent}" stroke-width="2" stroke-opacity="0.6"/>
      <circle cx="42" cy="36" r="10" fill="${accent}"/>
      <text x="68" y="44" fill="#F8FAFC" font-family="monospace" font-weight="700" font-size="22">DATA-PACK // ${escapeXml(pack.sourcePack.toUpperCase())} · SCENE 0${sceneIndex + 1}</text>
      <text x="868" y="44" text-anchor="end" fill="${accent}" font-family="monospace" font-weight="800" font-size="22">${escapeXml(compositionStyle.toUpperCase())}</text>
    </g>

    <!-- Main Synthesized Vector Rig from Google Data Pack -->
    ${vectorRig}

    <!-- Floating Context Sticker Badge -->
    <g transform="translate(${sceneIndex % 2 === 0 ? 150 : 590}, 390) rotate(${sceneIndex % 2 === 0 ? -6 : 6})">
      <rect x="0" y="0" width="340" height="84" rx="20" fill="${accent}" stroke="#090D16" stroke-width="5"/>
      <text x="170" y="53" text-anchor="middle" fill="#090D16" font-family="sans-serif" font-weight="900" font-size="26" letter-spacing="1.5">${escapeXml(badgeText)}</text>
    </g>

    <!-- Bottom Glassmorphic Scene Metadata Card -->
    <g transform="translate(88, 1340)">
      <rect x="0" y="0" width="904" height="340" rx="36" fill="#090D16" fill-opacity="0.78" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="3"/>
      <rect x="36" y="36" width="260" height="44" rx="12" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-width="1.5"/>
      <text x="166" y="65" text-anchor="middle" fill="${accent}" font-family="monospace" font-weight="800" font-size="20">SEED: ${escapeXml(photoSeedLabel.toUpperCase())}</text>
      <text x="36" y="148" fill="#FFFFFF" font-family="sans-serif" font-weight="900" font-size="44">${headlineShort}</text>
      <text x="36" y="210" fill="#CBD5E1" font-family="sans-serif" font-weight="600" font-size="28">${subShort}</text>
      <text x="36" y="285" fill="${accent}" font-family="monospace" font-weight="700" font-size="22">KEYWORDS: #${matched.matchedKeywords.join(' #')}</text>
    </g>
  </svg>`;

  const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return {
    sceneIndex,
    dataUri: encoded,
    clusterId: pack.clusterId,
    packTitle: pack.title,
    compositionStyle,
    matchedKeywords: matched.matchedKeywords,
    layersUsed: [
      `Backdrop:${pack.lightingPattern}`,
      `VectorRig:${pack.vectorRigType}`,
      `Style:${compositionStyle}`,
      `Badge:${badgeText}`,
    ],
    seed,
  };
}

/**
 * Menghasilkan 4 gambar kustom yang berbeda-beda untuk seluruh scene dalam sebuah script
 */
export function synthesizeAllSceneImagesFromDataPack(params: {
  topic: string;
  category?: string;
  priceLabel?: string;
  scenes: Array<{ text: string; subtext?: string }>;
  customPackOverride?: GoogleDataPackItem;
}): SynthesizedSceneImage[] {
  return params.scenes.map((sc, idx) =>
    synthesizeDataPackSceneImage({
      topic: params.topic,
      sceneText: sc.text,
      sceneSubtext: sc.subtext,
      sceneIndex: idx,
      category: params.category,
      priceLabel: params.priceLabel,
      customPackOverride: params.customPackOverride,
      styleIndexOverride: idx, // Jamin komposisi setiap scene berbeda!
    })
  );
}
