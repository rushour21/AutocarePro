'use client';

import { useEffect } from 'react';

/** Last-resort boundary: offers a retry, and a reset for when the browser's saved demo data is what broke the page. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="neu max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-500">This page hit an error. Try again, or reset the saved demo data if it keeps happening.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="btn btn-neu px-4 py-2" onClick={reset}>Try again</button>
          <button
            className="btn px-4 py-2"
            onClick={() => {
              try {
                window.localStorage.removeItem('autohub.db');
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
          >
            Reset demo data
          </button>
        </div>
      </div>
    </div>
  );
}
