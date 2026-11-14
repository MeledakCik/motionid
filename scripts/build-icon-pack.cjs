/**
 * Membuat lib/studio/packs/icons.data.ts dari ikon Lucide (lisensi ISC).
 * Jalankan: node scripts/build-icon-pack.cjs
 * Setiap elemen SVG (circle, rect, line, polyline, polygon, ellipse) diubah ke path `d`
 * supaya bisa digambar cepat di canvas memakai Path2D.
 */
const fs = require('fs');
const path = require('path');
const { icons } = require('lucide');

const GROUPS = [
  ['bisnis', 'Bisnis & Promo', ['shopping', 'cart', 'tag', 'percent', 'badge', 'gift', 'store', 'wallet', 'credit-card', 'receipt', 'banknote', 'coins', 'piggy', 'hand-coins', 'package', 'truck', 'briefcase', 'chart', 'trending', 'dollar', 'ticket', 'scan', 'qr-code', 'barcode', 'handshake', 'building', 'landmark', 'calculator']],
  ['makanan', 'Makanan & Minuman', ['coffee', 'cup', 'pizza', 'utensils', 'cake', 'cookie', 'croissant', 'sandwich', 'soup', 'salad', 'beef', 'fish', 'egg', 'apple', 'banana', 'cherry', 'citrus', 'grape', 'milk', 'wine', 'beer', 'martini', 'ice-cream', 'popcorn', 'candy', 'chef', 'drumstick', 'ham', 'carrot', 'wheat', 'lollipop', 'donut', 'dessert', 'glass-water', 'bottle', 'cooking-pot', 'microwave', 'refrigerator']],
  ['teknologi', 'Teknologi & Dev', ['code', 'terminal', 'cpu', 'server', 'database', 'cloud', 'wifi', 'bluetooth', 'monitor', 'laptop', 'smartphone', 'tablet', 'keyboard', 'mouse', 'git', 'github', 'bug', 'binary', 'braces', 'brackets', 'cable', 'hard-drive', 'router', 'satellite', 'bot', 'rocket', 'plug', 'battery', 'usb', 'webhook', 'workflow', 'blocks', 'component', 'layout', 'app-window', 'qr', 'radar', 'shield', 'lock', 'key', 'fingerprint', 'scan-face']],
  ['sosial', 'Sosial & Komunikasi', ['message', 'mail', 'phone', 'send', 'share', 'heart', 'thumbs', 'star', 'bell', 'at-sign', 'hash', 'megaphone', 'radio', 'rss', 'users', 'user', 'contact', 'smile', 'laugh', 'frown', 'meh', 'angry', 'annoyed', 'party', 'sparkle', 'flame', 'crown', 'award', 'trophy', 'medal', 'verified', 'instagram', 'youtube', 'twitch', 'facebook', 'linkedin', 'twitter']],
  ['edukasi', 'Edukasi & Kerja', ['book', 'graduation', 'school', 'pencil', 'pen', 'notebook', 'clipboard', 'file', 'folder', 'library', 'lightbulb', 'brain', 'puzzle', 'atom', 'flask', 'microscope', 'test-tube', 'calendar', 'clock', 'timer', 'alarm', 'hourglass', 'list', 'check', 'square-check', 'circle-check', 'target', 'goal', 'flag', 'presentation', 'ruler', 'compass', 'languages', 'sigma', 'pi', 'calculator']],
  ['media', 'Media & Kreatif', ['camera', 'image', 'film', 'video', 'clapperboard', 'music', 'mic', 'headphones', 'speaker', 'volume', 'play', 'pause', 'disc', 'palette', 'brush', 'paintbrush', 'pen-tool', 'figma', 'aperture', 'focus', 'crop', 'scissors', 'wand', 'layers', 'shapes', 'type', 'baseline', 'tv', 'projector', 'gamepad', 'joystick', 'dices', 'drama', 'guitar', 'piano', 'drum']],
  ['alam', 'Alam & Cuaca', ['sun', 'moon', 'cloud', 'rain', 'snow', 'wind', 'leaf', 'tree', 'flower', 'sprout', 'mountain', 'waves', 'droplet', 'zap', 'rainbow', 'sunrise', 'sunset', 'umbrella', 'thermometer', 'tornado', 'snowflake', 'cat', 'dog', 'bird', 'rabbit', 'squirrel', 'turtle', 'bug', 'shell', 'clover', 'palmtree', 'trees', 'earth', 'globe', 'orbit', 'telescope']],
  ['travel', 'Travel & Lokasi', ['map', 'pin', 'navigation', 'plane', 'car', 'bus', 'train', 'bike', 'ship', 'sailboat', 'tent', 'hotel', 'luggage', 'backpack', 'compass', 'route', 'signpost', 'milestone', 'fuel', 'parking', 'tram', 'caravan', 'castle', 'church', 'home', 'house', 'warehouse', 'factory']],
  ['kesehatan', 'Kesehatan & Olahraga', ['heart-pulse', 'activity', 'stethoscope', 'pill', 'syringe', 'hospital', 'ambulance', 'bandage', 'cross', 'dumbbell', 'bike', 'footprints', 'trophy', 'volleyball', 'baby', 'accessibility', 'apple', 'salad', 'scale', 'weight', 'bed', 'smile', 'shirt', 'glasses', 'gem', 'watch', 'sparkles', 'spray-can', 'scissors']],
  ['ui', 'Panah & UI', ['arrow', 'chevron', 'move', 'corner', 'circle', 'square', 'triangle', 'hexagon', 'octagon', 'pentagon', 'diamond', 'plus', 'minus', 'x', 'search', 'settings', 'sliders', 'filter', 'menu', 'grid', 'toggle', 'refresh', 'rotate', 'repeat', 'shuffle', 'download', 'upload', 'link', 'external', 'eye', 'maximize', 'minimize', 'info', 'help', 'alert', 'ban', 'loader', 'mouse-pointer', 'hand', 'pointer', 'touchpad']],
];

const TAG_ID = {
  shopping: 'belanja', cart: 'keranjang', tag: 'label harga', percent: 'diskon persen', gift: 'hadiah', store: 'toko umkm',
  wallet: 'dompet', 'credit-card': 'kartu bayar', receipt: 'struk', banknote: 'uang', coins: 'koin cuan', piggy: 'tabungan',
  package: 'paket', truck: 'kirim ongkir', briefcase: 'kerja', chart: 'grafik', trending: 'naik tren', dollar: 'uang',
  ticket: 'tiket voucher', coffee: 'kopi', cup: 'minuman', pizza: 'pizza makanan', utensils: 'makan', cake: 'kue',
  cookie: 'kue kering', soup: 'sup', salad: 'sehat', beef: 'daging', fish: 'ikan', egg: 'telur', apple: 'buah',
  milk: 'susu', 'ice-cream': 'es krim', chef: 'koki', code: 'koding', terminal: 'terminal', server: 'server', database: 'data',
  cloud: 'awan cloud', wifi: 'internet', monitor: 'komputer', laptop: 'laptop', smartphone: 'hp ponsel', bot: 'robot ai',
  rocket: 'roket launch', shield: 'aman keamanan', lock: 'kunci', message: 'pesan chat', mail: 'email', phone: 'telepon wa',
  send: 'kirim', share: 'bagikan', heart: 'suka cinta', thumbs: 'jempol like', star: 'bintang rating', bell: 'notifikasi',
  megaphone: 'pengumuman', users: 'orang tim', user: 'orang', smile: 'senyum', flame: 'api hot viral', crown: 'mahkota premium',
  trophy: 'juara', book: 'buku', graduation: 'wisuda kampus', school: 'sekolah', pencil: 'pensil tulis', lightbulb: 'ide',
  brain: 'otak pintar', calendar: 'tanggal jadwal', clock: 'jam waktu', timer: 'timer hitung mundur', check: 'centang',
  target: 'target', flag: 'bendera', camera: 'kamera foto', image: 'gambar', film: 'film', music: 'musik lagu', mic: 'mikrofon podcast',
  play: 'putar', palette: 'warna desain', gamepad: 'game', sun: 'matahari pagi', moon: 'bulan malam galau', rain: 'hujan',
  leaf: 'daun alam', tree: 'pohon', flower: 'bunga', mountain: 'gunung', waves: 'ombak pantai', zap: 'kilat cepat',
  map: 'peta', pin: 'lokasi', plane: 'pesawat liburan', car: 'mobil', bus: 'bus', train: 'kereta', bike: 'sepeda motor',
  home: 'rumah', house: 'rumah', 'heart-pulse': 'kesehatan', pill: 'obat', dumbbell: 'gym olahraga', arrow: 'panah',
  search: 'cari', download: 'unduh', sparkles: 'kilau spesial', gem: 'permata mewah', shirt: 'baju fashion',
};

function num(v) { return Number(v) || 0; }
function circle(cx, cy, r) { return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`; }
function ellipse(cx, cy, rx, ry) { return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`; }
function rect(x, y, w, h, rx) {
  if (!rx) return `M${x} ${y}h${w}v${h}h${-w}z`;
  const r = Math.min(rx, w / 2, h / 2);
  return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
}
function pts(p, close) {
  const n = String(p).trim().split(/[\s,]+/).map(Number);
  let d = '';
  for (let i = 0; i < n.length; i += 2) d += `${i ? 'L' : 'M'}${n[i]} ${n[i + 1]}`;
  return close ? d + 'z' : d;
}
function toD([tag, a]) {
  switch (tag) {
    case 'path': return a.d;
    case 'circle': return circle(num(a.cx), num(a.cy), num(a.r));
    case 'ellipse': return ellipse(num(a.cx), num(a.cy), num(a.rx), num(a.ry));
    case 'rect': return rect(num(a.x), num(a.y), num(a.width), num(a.height), num(a.rx || a.ry));
    case 'line': return `M${num(a.x1)} ${num(a.y1)}L${num(a.x2)} ${num(a.y2)}`;
    case 'polyline': return pts(a.points, false);
    case 'polygon': return pts(a.points, true);
    default: return '';
  }
}
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();
const human = (k) => k.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

// Ikon yang wajib ada (dipakai prompt engine, komponen, dan populer di konten)
const MUST = 'arrow-right badge-check badge-percent bell book-open bookmark briefcase calendar calendar-check check flame frown gift heart info lightbulb list-checks map-pin megaphone message-circle moon party-popper plane rocket search send shopping-bag shopping-cart smile sparkles star sun tag ticket users utensils zap coffee pizza cake cookie ice-cream soup salad sandwich croissant beef fish egg apple wine beer cup-soda milk chef-hat cooking-pot store wallet credit-card receipt banknote coins piggy-bank package truck percent trending-up chart-line chart-bar dollar-sign hand-coins handshake qr-code scan-line laptop smartphone monitor code terminal server database cloud wifi bot cpu shield-check lock key globe instagram youtube facebook twitter linkedin twitch mail phone message-square thumbs-up crown trophy award medal graduation-cap school pencil notebook-pen clipboard-check brain puzzle target flag timer clock alarm-clock hourglass camera image film video clapperboard music mic headphones palette brush wand-sparkles layers leaf trees flower-2 mountain waves droplet sunrise sunset umbrella snowflake cat dog bird car bus train-front bike ship tent hotel luggage house home map compass navigation heart-pulse activity stethoscope pill dumbbell footprints baby shirt glasses gem watch scissors sparkle check-circle circle-check x-circle alert-triangle thumbs-down arrow-up arrow-down arrow-left chevron-right play pause download upload link share-2 eye bookmark-check calendar-days map-pinned party-popper gift-box'.split(' ');
const seen = new Set();
const out = [];
for (const [pascal, node] of Object.entries(icons)) {
  const id = kebab(pascal);
  const d = node[2].map(toD).filter(Boolean).join('');
  if (!d || seen.has(d)) continue;
  let group = GROUPS.find(([, , kws]) => kws.some((k) => id === k || id.startsWith(k + '-') || id.includes('-' + k) || id.startsWith(k)));
  if (!group && MUST.includes(id)) group = GROUPS[GROUPS.length - 1];
  if (!group) continue;
  seen.add(d);
  const tags = new Set([group[0]]);
  Object.entries(TAG_ID).forEach(([k, v]) => { if (id.includes(k)) v.split(' ').forEach((t) => tags.add(t)); });
  id.split('-').forEach((t) => t.length > 2 && tags.add(t));
  out.push([id, human(id), group[0], [...tags].join(' '), d]);
}

// Batasi per grup agar perpustakaan seimbang; ikon wajib selalu masuk dan diletakkan di depan
const CAP = { ui: 55, edukasi: 85, teknologi: 85, sosial: 85, bisnis: 85 };
const per = {};
out.sort((a, b) => Number(MUST.includes(b[0])) - Number(MUST.includes(a[0])));
const final = out.filter((r) => {
  per[r[2]] = (per[r[2]] || 0) + 1;
  return MUST.includes(r[0]) || per[r[2]] <= (CAP[r[2]] || 80);
});
const missing = MUST.filter((m) => !final.some((r) => r[0] === m));
if (missing.length) console.log('tidak ada di lucide:', missing.join(' '));

const file = `/* AUTO-GENERATED oleh scripts/build-icon-pack.cjs — jangan edit manual.
 * Sumber ikon: Lucide (https://lucide.dev) lisensi ISC. */
export const ICON_GROUPS: Array<[string, string]> = ${JSON.stringify(GROUPS.map(([id, label]) => [id, label]))};
/** [id, nama, grup, tag (spasi), path d (viewBox 24, stroke)] */
export const ICON_DATA: Array<[string, string, string, string, string]> = ${JSON.stringify(final)};
`;
fs.mkdirSync(path.join(__dirname, '../lib/studio/packs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../lib/studio/packs/icons.data.ts'), file);
console.log('ikon:', final.length, per);
