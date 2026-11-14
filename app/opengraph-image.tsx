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
          background: 'radial-gradient(900px circle at 10% 0%, #5A2312 0%, #120E0C 60%)',
          color: '#FFF3EA',
        }}
      >
        <div style={{ fontSize: 34, color: '#FF6A3D', fontWeight: 700 }}>MotionKu</div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>
          Ketik Topik, Jadi Video TikTok
        </div>
        <div style={{ fontSize: 34, color: '#FFD2BF', marginTop: 32 }}>
          9 template motion graphic · caption & hashtag otomatis · gratis tanpa API key
        </div>
      </div>
    ),
    size
  );
}
