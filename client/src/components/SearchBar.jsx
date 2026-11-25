import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search Jaipur, Udaipur, Jaisalmer, wildlife, forts...',
  className = '',
  buttonLabel = '',
}) {
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(value);
  };

  return (
    <form onSubmit={handleFormSubmit} className={`relative flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {buttonLabel && (
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors"
        >
          {buttonLabel}
        </button>
      )}
    </form>
  );
}
