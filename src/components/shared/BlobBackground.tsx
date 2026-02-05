// components/shared/BlobBackground.tsx
'use client';

export function BlobBackground() {
  return (
    <div className="blob-container" aria-hidden="true">
      <div className="blob blob-blue" />
      <div className="blob blob-purple" />
      <div className="blob blob-cyan" />
    </div>
  );
}
