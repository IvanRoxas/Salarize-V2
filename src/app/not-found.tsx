import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl font-bold text-slate-400">4</span>
        <span className="text-4xl font-bold text-[var(--color-emerald-custom)]">0</span>
        <span className="text-4xl font-bold text-slate-400">4</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h1>
      <p className="text-slate-500 mb-8 max-w-sm text-sm">
        The page you're looking for doesn't exist or was moved.
      </p>
      <Link
        href="/"
        className="bg-[var(--color-emerald-custom)] text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
