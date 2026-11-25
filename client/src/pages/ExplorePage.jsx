import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { destinationAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import DestinationGrid from '../components/DestinationGrid';
import { CardSkeletonGrid } from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

const DEFAULT_FILTERS = {
  region: 'all',
  interest: 'all',
  bestSeason: 'all',
  maxBudget: '',
  maxDays: '',
  sort: 'name_asc',
};

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    interest: searchParams.get('interest') || 'all',
  });
  const [destinations, setDestinations] = useState([]);
  const [meta, setMeta] = useState({ regions: [], seasons: [], total: 0, page: 1, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const fetchDestinations = useCallback(
    async (pageToLoad = 1, append = false) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError('');

        const params = {
          page: pageToLoad,
          limit: 9,
          sort: filters.sort,
        };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (filters.region !== 'all') params.region = filters.region;
        if (filters.interest !== 'all') params.interest = filters.interest;
        if (filters.bestSeason !== 'all') params.bestSeason = filters.bestSeason;
        if (filters.maxBudget) params.maxBudget = filters.maxBudget;
        if (filters.maxDays) params.maxDays = filters.maxDays;

        const data = await destinationAPI.list(params);
        setDestinations((prev) => (append ? [...prev, ...data.destinations] : data.destinations));
        setMeta({
          regions: data.filters?.regions || [],
          seasons: data.filters?.seasons || [],
          total: data.total || 0,
          page: data.page || 1,
          hasMore: Boolean(data.hasMore),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, filters]
  );

  useEffect(() => {
    fetchDestinations(1, false);
  }, [fetchDestinations]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
    setSearchParams({});
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Rajasthan Discovery
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-white">
            Explore Destinations
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Filter by region, travel interest, season, daily budget, or recommended trip duration.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-400 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5">
          Showing {destinations.length} of {meta.total} destinations
        </span>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      <FilterPanel
        filters={filters}
        regions={meta.regions}
        seasons={meta.seasons}
        onChange={handleFilterChange}
        onReset={handleReset}
      />

      {loading ? (
        <CardSkeletonGrid count={6} />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => fetchDestinations(1, false)} />
      ) : destinations.length === 0 ? (
        <EmptyState
          title="No Rajasthan destinations match those filters"
          description="Try widening your daily budget or resetting active filters."
          actionLabel="Reset All Filters"
          onAction={handleReset}
        />
      ) : (
        <>
          <DestinationGrid destinations={destinations} />
          {meta.hasMore && (
            <div className="pt-4 text-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => fetchDestinations(meta.page + 1, true)}
                className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-6 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading more...' : 'Load More Destinations'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
