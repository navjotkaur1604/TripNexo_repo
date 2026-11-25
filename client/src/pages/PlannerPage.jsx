import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileDown, RefreshCw, Save } from 'lucide-react';
import { budgetAPI, destinationAPI, tripAPI } from '../services/api';
import { useTripBuilder } from '../context/TripBuilderContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TripForm from '../components/TripForm';
import MapView from '../components/MapView';
import BudgetSummary from '../components/BudgetSummary';
import DaySchedule from '../components/DaySchedule';
import LoadingSpinner from '../components/LoadingSpinner';
import { exportTripToPDF } from '../utils/pdfExport';

export default function PlannerPage() {
  const { state, dispatch } = useTripBuilder();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [allDestinations, setAllDestinations] = useState([]);
  const [loadingDests, setLoadingDests] = useState(true);
  const [liveBudget, setLiveBudget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);
  const [savingEdits, setSavingEdits] = useState(false);

  useEffect(() => {
    destinationAPI
      .list({ limit: 50, sort: 'name_asc' })
      .then((res) => setAllDestinations(res.destinations || []))
      .catch(() => setAllDestinations([]))
      .finally(() => setLoadingDests(false));
  }, []);

  // Live backend budget preview whenever trip inputs change
  useEffect(() => {
    if (state.selectedDestinations.length === 0) {
      setLiveBudget(null);
      return;
    }

    const customDaysMap = {};
    state.selectedDestinations.forEach((d) => {
      customDaysMap[d._id] = d.customDays || d.recommendedDays || 2;
    });

    const timer = setTimeout(() => {
      budgetAPI
        .estimate({
          destinationIds: state.selectedDestinations.map((d) => d._id),
          startingCity: state.startingCity,
          travellers: state.travellers,
          children: state.children,
          duration: state.duration || 1,
          customDaysMap,
          accommodationPreference: state.accommodationPreference,
          transportPreference: state.transportPreference,
          travelPace: state.travelPace,
          targetBudget: state.targetBudget,
        })
        .then((res) => setLiveBudget(res.estimate))
        .catch(() => {});
    }, 250);

    return () => clearTimeout(timer);
  }, [
    state.selectedDestinations,
    state.startingCity,
    state.travellers,
    state.children,
    state.duration,
    state.accommodationPreference,
    state.transportPreference,
    state.travelPace,
    state.targetBudget,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to save and generate your itinerary.', 'info');
      navigate('/login', { state: { from: '/planner' } });
      return;
    }
    if (state.selectedDestinations.length === 0) {
      showToast('Select at least one Rajasthan destination.', 'error');
      return;
    }

    const payload = {
      tripName: state.tripName,
      startingCity: state.startingCity,
      startDate: state.startDate,
      travellers: state.travellers,
      children: state.children,
      duration: state.duration || 1,
      travelPace: state.travelPace,
      interests: state.interests,
      accommodationPreference: state.accommodationPreference,
      transportPreference: state.transportPreference,
      budget: {
        targetMax: state.targetBudget,
      },
      notes: state.notes,
      destinations: state.selectedDestinations.map((d, idx) => ({
        destinationId: d._id,
        customDays: d.customDays || d.recommendedDays || 2,
        order: idx,
      })),
    };

    try {
      setSubmitting(true);
      let res;
      if (state.editingTripId) {
        res = await tripAPI.update(state.editingTripId, { ...payload, regenerate: true });
        showToast('Saved trip updated and itinerary regenerated!', 'success');
      } else {
        res = await tripAPI.create(payload);
        dispatch({ type: 'UPDATE_FIELDS', payload: { editingTripId: res.trip._id } });
        showToast('Trip created and day-wise itinerary generated!', 'success');
      }
      setActiveTrip(res.trip);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDayChange = (updatedDay) => {
    setActiveTrip((prev) =>
      prev
        ? {
            ...prev,
            itinerary: prev.itinerary.map((d) => (d._id === updatedDay._id ? updatedDay : d)),
          }
        : prev
    );
  };

  const handleSaveItineraryEdits = async () => {
    if (!activeTrip) return;
    try {
      setSavingEdits(true);
      const res = await tripAPI.update(activeTrip._id, {
        itineraryUpdates: activeTrip.itinerary.map((d) => ({
          _id: d._id,
          activities: d.activities,
          notes: d.notes,
        })),
      });
      setActiveTrip(res.trip);
      showToast('Itinerary edits saved to MongoDB!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingEdits(false);
    }
  };

  const handleRegenerate = async () => {
    if (!activeTrip) return;
    try {
      setSubmitting(true);
      const res = await tripAPI.regenerate(activeTrip._id, {
        duration: state.duration,
        travelPace: state.travelPace,
        interests: state.interests,
      });
      setActiveTrip(res.trip);
      showToast('Itinerary regenerated dynamically!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDests) return <LoadingSpinner label="Loading Rajasthan planner..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Smart Trip Planner
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-white">
            {state.editingTripId ? 'Edit & Regenerate Trip' : 'Build Your Rajasthan Itinerary'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Configure destinations, pace, stay tier, and transport. Backend logic allocates days
            and curates duplicate-free attractions.
          </p>
        </div>

        {state.editingTripId && (
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'RESET' });
              setActiveTrip(null);
            }}
            className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-amber-500/40"
          >
            Start Fresh Trip
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7">
          <TripForm
            formState={state}
            allDestinations={allDestinations}
            onUpdateFields={(fields) => dispatch({ type: 'UPDATE_FIELDS', payload: fields })}
            onAddDestination={(dest) => dispatch({ type: 'ADD_DESTINATION', payload: dest })}
            onRemoveDestination={(id) => dispatch({ type: 'REMOVE_DESTINATION', payload: id })}
            onReorderDestination={(index, direction) =>
              dispatch({ type: 'REORDER_DESTINATION', payload: { index, direction } })
            }
            onSetDestinationDays={(id, days) =>
              dispatch({ type: 'SET_DESTINATION_DAYS', payload: { id, days } })
            }
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel={state.editingTripId ? 'Update & Regenerate Itinerary' : 'Generate & Save Trip'}
          />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-white">Live Route Preview</h2>
            <MapView
              destinations={allDestinations}
              selectedDestinations={state.selectedDestinations}
              heightClass="h-[280px]"
            />
          </div>

          {liveBudget && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Live Cost Preview</h2>
              <BudgetSummary estimate={liveBudget} />
            </div>
          )}
        </div>
      </div>

      {/* Generated Itinerary Section */}
      {activeTrip && (
        <section className="space-y-6 pt-6 border-t border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Persisted in MongoDB
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {activeTrip.tripName} — Day-Wise Schedule
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveItineraryEdits}
                disabled={savingEdits}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                <Save className="h-3.5 w-3.5" />
                {savingEdits ? 'Saving...' : 'Save Day Edits'}
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-amber-500/40"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
              <button
                type="button"
                onClick={() => exportTripToPDF(activeTrip)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                <FileDown className="h-3.5 w-3.5" />
                Export PDF
              </button>
              <Link
                to={`/my-trips/${activeTrip._id}`}
                className="rounded-xl border border-amber-500/40 px-4 py-2 text-xs font-semibold text-amber-300"
              >
                Open Full Trip View
              </Link>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {(activeTrip.itinerary || []).map((day) => (
              <DaySchedule
                key={day._id || day.dayNumber}
                day={day}
                editable
                onUpdateDay={handleDayChange}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
