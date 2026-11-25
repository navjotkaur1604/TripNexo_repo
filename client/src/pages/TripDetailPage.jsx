import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calculator,
  Edit3,
  FileDown,
  RefreshCw,
  Save,
} from 'lucide-react';
import { budgetAPI, tripAPI } from '../services/api';
import { useTripBuilder } from '../context/TripBuilderContext';
import { useToast } from '../context/ToastContext';
import DaySchedule from '../components/DaySchedule';
import BudgetSummary from '../components/BudgetSummary';
import BudgetChart from '../components/BudgetChart';
import MapView from '../components/MapView';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatDate, capitalize } from '../utils/formatters';
import { exportTripToPDF } from '../utils/pdfExport';

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useTripBuilder();
  const { showToast } = useToast();

  const [trip, setTrip] = useState(null);
  const [freshEstimate, setFreshEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTrip = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await tripAPI.getById(id);
      setTrip(data.trip);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const handleDayChange = (updatedDay) => {
    setTrip((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((d) => (d._id === updatedDay._id ? updatedDay : d)),
    }));
  };

  const handleSaveEdits = async () => {
    try {
      setSaving(true);
      const res = await tripAPI.update(trip._id, {
        itineraryUpdates: trip.itinerary.map((d) => ({
          _id: d._id,
          activities: d.activities,
          notes: d.notes,
        })),
      });
      setTrip(res.trip);
      showToast('Itinerary updates saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setSaving(true);
      const res = await tripAPI.regenerate(trip._id, {});
      setTrip(res.trip);
      showToast('Itinerary regenerated dynamically!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculateBudget = async () => {
    try {
      setSaving(true);
      const res = await budgetAPI.getTripBudget(trip._id);
      setFreshEstimate(res.estimate);
      await loadTrip();
      showToast('Budget recalculated from latest destination rates!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading trip details..." />;
  if (error || !trip) return <ErrorMessage message={error || 'Trip not found'} onRetry={loadTrip} />;

  const destDocs = (trip.destinations || [])
    .map((d) => d.destinationId)
    .filter(Boolean);

  const displayEstimate = freshEstimate || {
    totalDays: trip.duration,
    nights: Math.max(0, (trip.duration || 1) - 1),
    rooms: Math.ceil(((trip.travellers || 1) + (trip.children || 0)) / 3),
    totalTravellers: (trip.travellers || 1) + (trip.children || 0),
    preferences: {
      accommodationPreference: trip.accommodationPreference,
      transportPreference: trip.transportPreference,
      travelPace: trip.travelPace,
    },
    breakdown: trip.estimatedCost?.breakdown || {},
    total: { min: trip.estimatedCost?.min || 0, max: trip.estimatedCost?.max || 0 },
    perPerson: {
      min: trip.estimatedCost?.perPersonMin || 0,
      max: trip.estimatedCost?.perPersonMax || 0,
    },
    assumptions: trip.estimatedCost?.assumptions || [],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <Link
        to="/my-trips"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-amber-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Trips
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/75 p-6">
        <div>
          <span className="rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-semibold uppercase text-amber-300">
            {capitalize(trip.status)}
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">{trip.tripName}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Starts {formatDate(trip.startDate)} from {trip.startingCity} · {trip.duration} day(s) ·{' '}
            {trip.travellers} adult(s){trip.children ? `, ${trip.children} child` : ''} ·{' '}
            {capitalize(trip.travelPace)} pace
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveEdits}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
          >
            <Save className="h-3.5 w-3.5" />
            Save Edits
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </button>
          <button
            type="button"
            onClick={handleRecalculateBudget}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200"
          >
            <Calculator className="h-3.5 w-3.5" />
            Recalculate Budget
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'LOAD_SAVED_TRIP', payload: trip });
              navigate('/planner');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Open in Planner
          </button>
          <button
            type="button"
            onClick={() => exportTripToPDF(trip)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            <FileDown className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7 space-y-5">
          <h2 className="font-display text-2xl font-bold text-white">Day-Wise Itinerary</h2>
          {(trip.itinerary || []).map((day) => (
            <DaySchedule
              key={day._id}
              day={day}
              editable
              onUpdateDay={handleDayChange}
            />
          ))}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-white">Trip Coordinate Route</h2>
            <MapView
              destinations={destDocs}
              selectedDestinations={destDocs}
              heightClass="h-[260px]"
            />
          </div>
          <BudgetSummary estimate={displayEstimate} />
          <BudgetChart breakdown={displayEstimate.breakdown} />
        </div>
      </div>
    </div>
  );
}
