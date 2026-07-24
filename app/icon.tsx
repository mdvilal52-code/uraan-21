import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 32, height: 32 };
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
          background: '#1a1410',
        }}
      >
        {/* Rotated square = diamond shape */}
        <div
          style={{
            width: '16px',
            height: '16px',
            background: '#c9a84c',
            transform: 'rotate(45deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              background: '#1a1410',
              transform: 'rotate(0deg)',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
