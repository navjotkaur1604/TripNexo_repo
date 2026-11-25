import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  title = 'Nothing found',
  description = 'Try adjusting your filters or creating a new trip.',
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center max-w-lg mx-auto my-6">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
        <Compass className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
