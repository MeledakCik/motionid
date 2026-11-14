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
          background: 'linear-gradient(135deg, #6A3CF6, #9775FF)',
          color: '#FFFFFF',
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
