import { SlidersHorizontal, RotateCcw } from 'lucide-react';

const INTEREST_OPTIONS = [
  { value: 'all', label: 'All Interests' },
  { value: 'heritage', label: 'Heritage & Forts' },
  { value: 'culture', label: 'Culture & Arts' },
  { value: 'lake', label: 'Lakes & Palaces' },
  { value: 'wildlife', label: 'Wildlife Safaris' },
  { value: 'adventure', label: 'Desert & Adventure' },
  { value: 'spiritual', label: 'Spiritual & Temples' },
  { value: 'nature', label: 'Hills & Nature' },
  { value: 'shopping', label: 'Bazaars & Crafts' },
];

export default function FilterPanel({
  filters,
  regions = [],
  seasons = [],
  onChange,
  onReset,
}) {
  const selectClass =
    'w-full rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <SlidersHorizontal className="h-4 w-4 text-amber-400" />
          <span>Refine Rajasthan Destinations</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-amber-400 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Region</label>
          <select
            value={filters.region}
            onChange={(e) => onChange('region', e.target.value)}
            className={selectClass}
          >
            <option value="all">All Regions</option>
            {regions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Interest</label>
          <select
            value={filters.interest}
            onChange={(e) => onChange('interest', e.target.value)}
            className={selectClass}
          >
            {INTEREST_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Best Season</label>
          <select
            value={filters.bestSeason}
            onChange={(e) => onChange('bestSeason', e.target.value)}
            className={selectClass}
          >
            <option value="all">Any Season</option>
            {seasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Max Daily Budget</label>
          <select
            value={filters.maxBudget}
            onChange={(e) => onChange('maxBudget', e.target.value)}
            className={selectClass}
          >
            <option value="">Any Budget</option>
            <option value="1200">Under ₹1,200 / day</option>
            <option value="1500">Under ₹1,500 / day</option>
            <option value="2000">Under ₹2,000 / day</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Max Duration</label>
          <select
            value={filters.maxDays}
            onChange={(e) => onChange('maxDays', e.target.value)}
            className={selectClass}
          >
            <option value="">Any Duration</option>
            <option value="1">1 Day</option>
            <option value="2">Up to 2 Days</option>
            <option value="3">Up to 3 Days</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Sort By</label>
          <select
            value={filters.sort}
            onChange={(e) => onChange('sort', e.target.value)}
            className={selectClass}
          >
            <option value="name_asc">Name (A → Z)</option>
            <option value="name_desc">Name (Z → A)</option>
            <option value="budget_asc">Budget (Low → High)</option>
            <option value="budget_desc">Budget (High → Low)</option>
            <option value="duration_asc">Duration (Shortest)</option>
            <option value="duration_desc">Duration (Longest)</option>
            <option value="rating_desc">Top Rated</option>
          </select>
        </div>
      </div>
    </div>
  );
}
