import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const runtime = 'edge';
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FF6A3D, #FFB547)',
          color: '#120E0C',
          fontSize: 40,
          fontWeight: 900,
          borderRadius: 14,
        }}
      >
        M
      </div>
    ),
    size
  );
}
