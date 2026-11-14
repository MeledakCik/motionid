import { ImageResponse } from 'next/og';

export const alt = 'MotionKu — Generator Video TikTok & Reels Otomatis';
export const size = { width: 1200, height: 630 };
export const runtime = 'edge';
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'radial-gradient(900px circle at 10% 0%, #5B33E0 0%, #1E1150 62%)',
          color: '#FFFFFF',
        }}
      >
        <div style={{ fontSize: 34, color: '#C6F432', fontWeight: 700 }}>MotionKu</div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>
          Ketik Topik, Jadi Video TikTok
        </div>
        <div style={{ fontSize: 34, color: '#D2CFDC', marginTop: 32 }}>
          5.000+ template · 9.700+ transisi · caption & hashtag otomatis · gratis tanpa API key
        </div>
      </div>
    ),
    size
  );
}
