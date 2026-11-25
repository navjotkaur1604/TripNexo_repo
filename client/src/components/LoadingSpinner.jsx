import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ label = 'Loading...', size = 'md' }) {
  const dim = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-7 w-7';
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-slate-400">
      <Loader2 className={`${dim} animate-spin text-amber-400`} />
      {label && <p className="text-sm font-medium">{label}</p>}
    </div>
  );
}

export function CardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden animate-pulse"
        >
          <div className="h-48 bg-slate-800" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-2/3 rounded bg-slate-800" />
            <div className="h-3 w-full rounded bg-slate-800" />
            <div className="h-3 w-4/5 rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
