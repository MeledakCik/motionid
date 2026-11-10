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
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          color: 'white',
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
