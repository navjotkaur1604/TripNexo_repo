import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, CalendarCheck, Heart, Plus, Wallet } from 'lucide-react';
import { tripAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTripBuilder } from '../context/TripBuilderContext';
import { useToast } from '../context/ToastContext';
import ItineraryCard from '../components/ItineraryCard';
import ConfirmationModal from '../components/ConfirmationModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { formatINRRange } from '../utils/formatters';
import { exportTripToPDF } from '../utils/pdfExport';

export default function MyTripsPage() {
  const { user } = useAuth();
  const { dispatch } = useTripBuilder();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    upcomingTrips: 0,
    totalEstimatedMin: 0,
    totalEstimatedMax: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tripToDelete, setTripToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await tripAPI.list();
      setTrips(data.trips || []);
      setStats(
        data.stats || {
          totalTrips: 0,
          upcomingTrips: 0,
          totalEstimatedMin: 0,
          totalEstimatedMax: 0,
        }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleDuplicate = async (tripId) => {
    try {
      await tripAPI.duplicate(tripId);
      showToast('Trip duplicated!', 'success');
      await loadTrips();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!tripToDelete) return;
    try {
      setDeleting(true);
      await tripAPI.remove(tripToDelete._id);
      showToast('Trip deleted.', 'success');
      setTripToDelete(null);
      await loadTrips();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenInPlanner = (trip) => {
    dispatch({ type: 'LOAD_SAVED_TRIP', payload: trip });
    navigate('/planner');
  };

  if (loading) return <LoadingSpinner label="Loading your Rajasthan trips..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadTrips} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Traveller Dashboard
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-white">
            My Saved Trips
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your persistent MongoDB itineraries, recalculate estimates, duplicate routes, or
            export PDFs.
          </p>
        </div>

        <Link
          to="/planner"
          onClick={() => dispatch({ type: 'RESET' })}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          Plan New Trip
        </Link>
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
          <Briefcase className="h-5 w-5 text-amber-400 mb-2" />
          <p className="text-xs text-slate-400">Planned Trips</p>
          <p className="text-2xl font-bold text-white mt-0.5">{stats.totalTrips}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
          <CalendarCheck className="h-5 w-5 text-sky-400 mb-2" />
          <p className="text-xs text-slate-400">Upcoming Trips</p>
          <p className="text-2xl font-bold text-white mt-0.5">{stats.upcomingTrips}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
          <Wallet className="h-5 w-5 text-emerald-400 mb-2" />
          <p className="text-xs text-slate-400">Total Estimated Spend</p>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">
            {formatINRRange(stats.totalEstimatedMin, stats.totalEstimatedMax)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
          <Heart className="h-5 w-5 text-rose-400 mb-2" />
          <p className="text-xs text-slate-400">Favourite Destinations</p>
          <p className="text-2xl font-bold text-white mt-0.5">{user?.favorites?.length || 0}</p>
        </div>
      </div>

      {/* Favourite Destinations Strip */}
      {user?.favorites?.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2.5">
            Your Favourite Rajasthan Hubs
          </p>
          <div className="flex flex-wrap gap-2">
            {user.favorites.map((fav) => (
              <Link
                key={fav._id}
                to={`/destination/${fav.slug || fav._id}`}
                className="rounded-full border border-slate-700 bg-slate-950 px-3.5 py-1 text-xs font-medium text-slate-200 hover:border-amber-500/40"
              >
                {fav.name} · {fav.region}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trips Grid */}
      {trips.length === 0 ? (
        <EmptyState
          title="No saved trips yet"
          description="Use the Smart Trip Planner to generate your first Rajasthan itinerary and budget."
          actionLabel="Open Smart Planner"
          actionTo="/planner"
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {trips.map((trip) => (
            <ItineraryCard
              key={trip._id}
              trip={trip}
              onDuplicate={handleDuplicate}
              onDelete={setTripToDelete}
              onDownloadPdf={exportTripToPDF}
              onOpenInPlanner={handleOpenInPlanner}
            />
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(tripToDelete)}
        title="Delete Saved Trip"
        message={`Are you sure you want to permanently delete "${tripToDelete?.tripName}" and its day-wise itinerary?`}
        confirmLabel="Delete Trip"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTripToDelete(null)}
      />
    </div>
  );
}
