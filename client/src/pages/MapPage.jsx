import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Check } from 'lucide-react';
import { destinationAPI } from '../services/api';
import { useTripBuilder } from '../context/TripBuilderContext';
import MapView from '../components/MapView';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function MapPage() {
  const { state, dispatch } = useTripBuilder();
  const [destinations, setDestinations] = useState([]);
  const [showAttractions, setShowAttractions] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    destinationAPI
      .list({ limit: 50, sort: 'name_asc' })
      .then((res) => setDestinations(res.destinations || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Loading Rajasthan map coordinates..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            OpenStreetMap & Leaflet
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-white">
            Interactive Rajasthan Map
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Click destinations on the left to build a coordinate route or inspect attraction pins.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={showAttractions}
            onChange={(e) => setShowAttractions(e.target.checked)}
            className="accent-amber-500"
          />
          Show Attraction Markers
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/75 p-4 space-y-3 max-h-[540px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Route Stops ({state.selectedDestinations.length})
            </h2>
            <Link to="/planner" className="text-xs font-semibold text-amber-400 hover:underline">
              Open in Planner →
            </Link>
          </div>

          <div className="space-y-2">
            {destinations.map((dest) => {
              const selected = state.selectedDestinations.some((s) => s._id === dest._id);
              return (
                <div
                  key={dest._id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/destination/${dest.slug || dest._id}`}
                      className="text-sm font-medium text-white hover:text-amber-400 truncate block"
                    >
                      {dest.name}
                    </Link>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-amber-400" />
                      {dest.coordinates.lat.toFixed(2)}, {dest.coordinates.lng.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: selected ? 'REMOVE_DESTINATION' : 'ADD_DESTINATION',
                        payload: selected ? dest._id : dest,
                      })
                    }
                    className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      selected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {selected ? 'In Route' : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8">
          <MapView
            destinations={destinations}
            selectedDestinations={state.selectedDestinations}
            showAttractions={showAttractions}
            heightClass="h-[540px]"
          />
        </div>
      </div>
    </div>
  );
}
