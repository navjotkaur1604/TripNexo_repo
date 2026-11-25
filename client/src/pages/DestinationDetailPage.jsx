import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Heart,
  MapPin,
  Plus,
  Star,
  Trash2,
  Sun,
} from 'lucide-react';
import { destinationAPI, reviewAPI } from '../services/api';
import { useTripBuilder } from '../context/TripBuilderContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SafeImage from '../components/SafeImage';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatDate, formatINRRange } from '../utils/formatters';

export default function DestinationDetailPage() {
  const { id } = useParams();
  const { state, dispatch } = useTripBuilder();
  const { user, isAuthenticated, toggleFavorite } = useAuth();
  const { showToast } = useToast();

  const [destination, setDestination] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await destinationAPI.getById(id);
      setDestination(data.destination);
      setNearby(data.nearbyDestinations || []);
      const revData = await reviewAPI.listByDestination(data.destination._id);
      setReviews(revData.reviews || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  if (loading) return <LoadingSpinner label="Loading destination details..." />;
  if (error || !destination) {
    return <ErrorMessage message={error || 'Destination not found'} onRetry={loadDetails} />;
  }

  const isSelected = state.selectedDestinations.some((d) => d._id === destination._id);
  const isFavorite = user?.favorites?.some(
    (f) => String(f._id || f) === String(destination._id)
  );

  const handleToggleTrip = () => {
    if (isSelected) {
      dispatch({ type: 'REMOVE_DESTINATION', payload: destination._id });
      showToast(`${destination.name} removed from pending trip.`, 'info');
    } else {
      dispatch({ type: 'ADD_DESTINATION', payload: destination });
      showToast(`${destination.name} added to your pending trip!`, 'success');
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to save favourites.', 'info');
      return;
    }
    try {
      const res = await toggleFavorite(destination._id);
      showToast(
        res.isFavorite ? 'Added to favourite destinations.' : 'Removed from favourites.',
        'success'
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to submit a review.', 'info');
      return;
    }
    try {
      setSubmittingReview(true);
      await reviewAPI.create({
        destinationId: destination._id,
        rating: Number(rating),
        comment,
      });
      setComment('');
      showToast('Review submitted!', 'success');
      await loadDetails();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewAPI.remove(reviewId);
      showToast('Review deleted.', 'success');
      await loadDetails();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const dailyMin =
    (destination.accommodation?.moderate?.min || 0) + (destination.food?.moderate?.min || 0);
  const dailyMax =
    (destination.accommodation?.moderate?.max || 0) + (destination.food?.moderate?.max || 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-amber-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Explore
      </Link>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
        <div className="h-72 sm:h-96 w-full relative">
          <SafeImage
            src={destination.images?.[0]}
            alt={destination.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-amber-300 mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-3 py-1 border border-amber-500/30">
                  <MapPin className="h-3.5 w-3.5" />
                  {destination.region}, {destination.state}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-3 py-1 border border-slate-700 text-slate-200">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {destination.averageRating?.toFixed(1) || '4.5'} ({destination.reviewCount || 0} reviews)
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white">
                {destination.name}
              </h1>
              <p className="mt-1 text-sm sm:text-base text-slate-300">{destination.tagline}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleFavorite}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isFavorite
                    ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                    : 'bg-slate-950/80 border-slate-700 text-slate-200 hover:border-rose-400'
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Saved' : 'Favourite'}
              </button>
              <button
                type="button"
                onClick={handleToggleTrip}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                }`}
              >
                {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {isSelected ? 'Added to Pending Trip' : 'Add to Trip'}
              </button>
              <Link
                to="/planner"
                className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/20"
              >
                Open Planner
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Overview & Indicative Planning Costs */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">About {destination.name}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{destination.description}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {(destination.interests || []).map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs font-medium capitalize text-amber-300"
                >
                  {interest}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">
              Key Tourist Attractions ({destination.attractions?.length || 0})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(destination.attractions || []).map((attr) => (
                <div
                  key={attr._id || attr.name}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">{attr.name}</h3>
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-300">
                      {attr.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{attr.description}</p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-400" />
                      {attr.durationHours}h ({attr.preferredSlot})
                    </span>
                    <span>
                      Entry est: {attr.entryFeeMax > 0 ? formatINRRange(attr.entryFeeMin, attr.entryFeeMax) : 'Free / Nominal'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Cost & Info */}
        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Planning Snapshot</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  Recommended Stay
                </span>
                <span className="font-semibold text-white">{destination.recommendedDays} day(s)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-400" />
                  Best Season
                </span>
                <span className="font-semibold text-white">{destination.bestSeason}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                <span className="text-slate-400">Indicative Daily Base</span>
                <span className="font-semibold text-emerald-400">
                  {formatINRRange(dailyMin, dailyMax)}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs">
              <p className="font-semibold uppercase tracking-wider text-amber-400">
                Indicative Cost Ranges (INR)
              </p>
              <div className="flex justify-between">
                <span className="text-slate-400">Stay (Economical)</span>
                <span className="text-slate-200">
                  {formatINRRange(destination.accommodation?.economical?.min, destination.accommodation?.economical?.max)}/night
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Stay (Moderate)</span>
                <span className="text-slate-200">
                  {formatINRRange(destination.accommodation?.moderate?.min, destination.accommodation?.moderate?.max)}/night
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Stay (Premium)</span>
                <span className="text-slate-200">
                  {formatINRRange(destination.accommodation?.premium?.min, destination.accommodation?.premium?.max)}/night
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Food (Moderate)</span>
                <span className="text-slate-200">
                  {formatINRRange(destination.food?.moderate?.min, destination.food?.moderate?.max)}/person/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Local Cab</span>
                <span className="text-slate-200">
                  {formatINRRange(destination.localTransport?.private_cab?.min, destination.localTransport?.private_cab?.max)}/vehicle/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sightseeing</span>
                <span className="text-slate-200">
                  {formatINRRange(destination.activities?.min, destination.activities?.max)}/person/day
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Planning estimates only; verify seasonal tariffs before booking.
            </p>
          </div>
        </aside>
      </div>

      {/* Nearby Destinations */}
      {nearby.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-white">Nearby Rajasthan Hubs</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {nearby.map((nb) => (
              <Link
                key={nb._id}
                to={`/destination/${nb.slug || nb._id}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-amber-500/40 transition-colors"
              >
                <SafeImage
                  src={nb.images?.[0]}
                  alt={nb.name}
                  className="h-16 w-20 rounded-xl object-cover shrink-0"
                />
                <div>
                  <h3 className="font-semibold text-white">{nb.name}</h3>
                  <p className="text-xs text-slate-400">
                    {nb.region} · ~{nb.approxDistanceKm} km straight-line
                  </p>
                  <p className="text-xs text-amber-400 mt-1">{nb.recommendedDays} day(s) rec.</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Traveller Reviews */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-white">
            Traveller Reviews ({reviews.length})
          </h2>
        </div>

        <form onSubmit={handleReviewSubmit} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs font-medium text-slate-300">Rating:</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white"
            >
              <option value={5}>5 — Excellent</option>
              <option value={4}>4 — Very Good</option>
              <option value={3}>3 — Good</option>
              <option value={2}>2 — Fair</option>
              <option value={1}>1 — Poor</option>
            </select>
          </div>
          <textarea
            rows={2}
            required
            minLength={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              isAuthenticated
                ? `Share planning tips or seasonal feedback about ${destination.name}...`
                : 'Sign in to leave a review for this destination...'
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submittingReview}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {submittingReview ? 'Submitting...' : 'Post Review'}
          </button>
        </form>

        {reviews.length === 0 ? (
          <p className="text-sm text-slate-400">No reviews yet. Be the first traveller to share tips!</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {rev.userId?.name || 'Traveller'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      {rev.rating}/5
                    </span>
                    <span className="text-xs text-slate-500">{formatDate(rev.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-300">{rev.comment}</p>
                </div>
                {user && (String(user._id) === String(rev.userId?._id) || user.role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev._id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    aria-label="Delete review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
