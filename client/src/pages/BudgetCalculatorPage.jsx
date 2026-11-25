import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { budgetAPI, destinationAPI } from '../services/api';
import { useTripBuilder } from '../context/TripBuilderContext';
import BudgetSummary from '../components/BudgetSummary';
import BudgetChart from '../components/BudgetChart';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatINRRange, capitalize } from '../utils/formatters';

export default function BudgetCalculatorPage() {
  const { state } = useTripBuilder();
  const [destinations, setDestinations] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() =>
    state.selectedDestinations.map((d) => d._id)
  );
  const [form, setForm] = useState({
    startingCity: state.startingCity || 'Jaipur',
    travellers: state.travellers || 2,
    children: state.children || 0,
    duration: state.duration || 5,
    accommodationPreference: state.accommodationPreference || 'moderate',
    transportPreference: state.transportPreference || 'private_cab',
    travelPace: state.travelPace || 'balanced',
    targetBudget: state.targetBudget || 50000,
    roomsOverride: '',
    nightsOverride: '',
  });

  const [estimate, setEstimate] = useState(null);
  const [tierComparison, setTierComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    destinationAPI
      .list({ limit: 50, sort: 'name_asc' })
      .then((res) => {
        const list = res.destinations || [];
        setDestinations(list);
        if (selectedIds.length === 0 && list.length >= 2) {
          setSelectedIds([list[0]._id, list[1]._id]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runEstimate = async (ids = selectedIds) => {
    if (!ids.length) return;
    try {
      setCalculating(true);
      setError('');
      const res = await budgetAPI.estimate({
        destinationIds: ids,
        startingCity: form.startingCity,
        travellers: Number(form.travellers),
        children: Number(form.children),
        duration: Number(form.duration) || null,
        accommodationPreference: form.accommodationPreference,
        transportPreference: form.transportPreference,
        travelPace: form.travelPace,
        targetBudget: Number(form.targetBudget),
        roomsOverride: form.roomsOverride === '' ? null : Number(form.roomsOverride),
        nightsOverride: form.nightsOverride === '' ? null : Number(form.nightsOverride),
      });
      setEstimate(res.estimate);
      setTierComparison(res.tierComparison || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (!loading && selectedIds.length > 0) {
      runEstimate(selectedIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const toggleDestination = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const inputClass =
    'w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none';

  if (loading) return <LoadingSpinner label="Loading budget calculator..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          Transparent Cost Estimation
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-white">
          Rajasthan Trip Budget Calculator
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Backend-computed indicative INR ranges separating per-room-night, per-person, per-vehicle,
          and shared safari vehicle assumptions.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runEstimate();
          }}
          className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
              Select Destinations ({selectedIds.length})
            </label>
            <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-2.5">
              {destinations.map((dest) => {
                const checked = selectedIds.includes(dest._id);
                return (
                  <button
                    key={dest._id}
                    type="button"
                    onClick={() => toggleDestination(dest._id)}
                    className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                      checked
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    {dest.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Starting City</label>
              <input
                type="text"
                value={form.startingCity}
                onChange={(e) => setForm({ ...form, startingCity: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Total Days</label>
              <input
                type="number"
                min={1}
                max={45}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Adults</label>
              <input
                type="number"
                min={1}
                max={30}
                value={form.travellers}
                onChange={(e) => setForm({ ...form, travellers: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Children</label>
              <input
                type="number"
                min={0}
                max={20}
                value={form.children}
                onChange={(e) => setForm({ ...form, children: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Accommodation Tier</label>
              <select
                value={form.accommodationPreference}
                onChange={(e) => setForm({ ...form, accommodationPreference: e.target.value })}
                className={inputClass}
              >
                <option value="economical">Economical</option>
                <option value="moderate">Moderate</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Transport Mode</label>
              <select
                value={form.transportPreference}
                onChange={(e) => setForm({ ...form, transportPreference: e.target.value })}
                className={inputClass}
              >
                <option value="public">Public Transport</option>
                <option value="private_cab">Private Cab</option>
                <option value="self_drive">Self-Drive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Travel Pace</label>
              <select
                value={form.travelPace}
                onChange={(e) => setForm({ ...form, travelPace: e.target.value })}
                className={inputClass}
              >
                <option value="relaxed">Relaxed</option>
                <option value="balanced">Balanced</option>
                <option value="packed">Packed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Budget (INR)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={form.targetBudget}
                onChange={(e) => setForm({ ...form, targetBudget: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Rooms Override (opt.)</label>
              <input
                type="number"
                min={1}
                placeholder="Auto (3/room)"
                value={form.roomsOverride}
                onChange={(e) => setForm({ ...form, roomsOverride: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nights Override (opt.)</label>
              <input
                type="number"
                min={0}
                placeholder="Auto (days-1)"
                value={form.nightsOverride}
                onChange={(e) => setForm({ ...form, nightsOverride: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={calculating || selectedIds.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            <Calculator className="h-4 w-4" />
            {calculating ? 'Calculating...' : 'Calculate Estimate'}
          </button>
        </form>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorMessage message={error} onRetry={() => runEstimate()} />}

          {estimate && (
            <>
              <BudgetSummary estimate={estimate} />
              <BudgetChart breakdown={estimate.breakdown} />

              {tierComparison.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/75 overflow-hidden">
                  <div className="border-b border-slate-800 px-5 py-3.5">
                    <h3 className="text-sm font-semibold text-white">
                      Tier Cost Comparison (Economical vs Moderate vs Premium)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950/60 text-xs uppercase text-slate-400">
                        <tr>
                          <th className="px-5 py-3">Stay Tier</th>
                          <th className="px-5 py-3">Total Estimate</th>
                          <th className="px-5 py-3">Per Person</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {tierComparison.map((row) => (
                          <tr key={row.tier}>
                            <td className="px-5 py-3 font-medium text-white">
                              {capitalize(row.tier)}
                            </td>
                            <td className="px-5 py-3 text-amber-300 font-semibold">
                              {formatINRRange(row.totalMin, row.totalMax)}
                            </td>
                            <td className="px-5 py-3 text-emerald-400">
                              {formatINRRange(row.perPersonMin, row.perPersonMax)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
