'use client';

import clsx from 'clsx';
import { Camera } from 'lucide-react';
import { useRef } from 'react';

const MAX_SIDE = 640;

/** Photos live in the browser's small store until there is a backend, so they are shrunk first. */
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    img.src = url;
  });
}

export function PhotoButton({ label, onPhoto, onError, children, className, plain }: { label: string; onPhoto: (dataUrl: string) => void; onError?: (m: string) => void; children?: React.ReactNode; className?: string; plain?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        aria-label={label}
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          for (const f of files) {
            try {
              onPhoto(await shrink(f));
            } catch (err) {
              onError?.((err as Error).message);
            }
          }
        }}
      />
      <button type="button" aria-label={children ? undefined : label} onClick={() => input.current?.click()} className={clsx(!plain && 'btn btn-neu', className)}>
        {children ?? <Camera className="h-[18px] w-[18px]" />}
      </button>
    </>
  );
}
