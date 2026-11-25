import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ title = 'Unable to load data', message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 text-center max-w-xl mx-auto my-6">
      <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
      <h3 className="text-base font-semibold text-rose-200">{title}</h3>
      {message && <p className="mt-1.5 text-sm text-rose-300/80">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/40 px-4 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/30 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
