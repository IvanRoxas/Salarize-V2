'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error caught by boundary:', error);
  }, [error]);

  return (
    <div className="bg-white p-10 rounded-2xl shadow-sm border border-red-200 flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-12">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
      <p className="text-slate-500 mb-6 text-sm max-w-sm">
        An unexpected error occurred while loading this section. Try again or contact system support.
      </p>
      <button
        onClick={() => reset()}
        className="bg-slate-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
      >
        Try Again
      </button>
    </div>
  );
}
