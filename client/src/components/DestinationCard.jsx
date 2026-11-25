import { Link } from 'react-router-dom';
import { Calendar, Heart, MapPin, Plus, Check, Star } from 'lucide-react';
import SafeImage from './SafeImage';
import { formatINR } from '../utils/formatters';
import { useTripBuilder } from '../context/TripBuilderContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function DestinationCard({ destination }) {
  const { state, dispatch } = useTripBuilder();
  const { user, isAuthenticated, toggleFavorite } = useAuth();
  const { showToast } = useToast();

  const isSelected = state.selectedDestinations.some((d) => d._id === destination._id);
  const isFavorite = user?.favorites?.some(
    (f) => String(f._id || f) === String(destination._id)
  );

  const indicativeDailyMin =
    (destination.accommodation?.moderate?.min || 1800) + (destination.food?.moderate?.min || 750);

  const handleAddToTrip = (e) => {
    e.preventDefault();
    if (isSelected) {
      dispatch({ type: 'REMOVE_DESTINATION', payload: destination._id });
      showToast(`${destination.name} removed from trip planner.`, 'info');
    } else {
      dispatch({ type: 'ADD_DESTINATION', payload: destination });
      showToast(`${destination.name} added to your pending trip!`, 'success');
    }
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Sign in to save favourite destinations.', 'info');
      return;
    }
    try {
      const res = await toggleFavorite(destination._id);
      showToast(
        res.isFavorite
          ? `${destination.name} saved to favourites.`
          : `${destination.name} removed from favourites.`,
        'success'
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/75 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-amber-500/10">
      <Link to={`/destination/${destination.slug || destination._id}`} className="relative h-52 overflow-hidden block">
        <SafeImage
          src={destination.images?.[0]}
          alt={destination.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-slate-950/75 px-2.5 py-1 text-xs font-medium text-amber-300 backdrop-blur-sm border border-amber-500/20">
          <MapPin className="h-3 w-3" />
          <span>{destination.region}</span>
        </div>

        <button
          type="button"
          onClick={handleToggleFavorite}
          className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm border transition-colors ${
            isFavorite
              ? 'bg-rose-500/90 border-rose-400 text-white'
              : 'bg-slate-950/70 border-slate-700 text-slate-300 hover:text-rose-400'
          }`}
          aria-label={`Toggle favourite for ${destination.name}`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-white leading-tight">
              {destination.name}
            </h3>
            <p className="text-xs text-slate-300 line-clamp-1">{destination.tagline}</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-950/80 px-2 py-0.5 text-xs font-semibold text-amber-400">
            <Star className="h-3.5 w-3.5 fill-amber-400" />
            <span>{destination.averageRating?.toFixed(1) || '4.5'}</span>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {destination.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {(destination.interests || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-800/90 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              <span>{destination.recommendedDays} day(s) rec.</span>
            </div>
            <p className="text-xs font-semibold text-slate-200 mt-0.5">
              Est. {formatINR(indicativeDailyMin)}/day+
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/destination/${destination.slug || destination._id}`}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 transition-colors"
            >
              Details
            </Link>
            <button
              type="button"
              onClick={handleAddToTrip}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                isSelected
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              }`}
            >
              {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {isSelected ? 'Added' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
