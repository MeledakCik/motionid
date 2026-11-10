import { ImageResponse } from 'next/og';

export const alt = 'MotionKu — Generator Video TikTok & Reels Otomatis';
export const size = { width: 1200, height: 630 };
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
          background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 55%, #0e7490 100%)',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 34, color: '#67e8f9', fontWeight: 700 }}>MotionKu</div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>
          Ketik Topik, Jadi Video TikTok
        </div>
        <div style={{ fontSize: 34, color: '#cbd5e1', marginTop: 32 }}>
          9 template motion graphic · caption & hashtag otomatis · gratis tanpa API key
        </div>
      </div>
    ),
    size
  );
}
