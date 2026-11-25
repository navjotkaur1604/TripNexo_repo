import { ArrowUp, ArrowDown, Trash2, Sparkles } from 'lucide-react';

const INTEREST_CHIPS = [
  'heritage',
  'culture',
  'lake',
  'wildlife',
  'adventure',
  'spiritual',
  'nature',
  'shopping',
];

export default function TripForm({
  formState,
  allDestinations = [],
  onUpdateFields,
  onAddDestination,
  onRemoveDestination,
  onReorderDestination,
  onSetDestinationDays,
  onSubmit,
  submitting = false,
  submitLabel = 'Generate & Save Trip',
}) {
  const inputClass =
    'w-full rounded-xl border border-slate-700/80 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none';

  const toggleInterest = (interest) => {
    const current = formState.interests || [];
    const exists = current.includes(interest);
    const next = exists ? current.filter((i) => i !== interest) : [...current, interest];
    onUpdateFields({ interests: next.length ? next : ['heritage'] });
  };

  const unselected = allDestinations.filter(
    (d) => !formState.selectedDestinations.some((s) => s._id === d._id)
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">1. Trip Details & Preferences</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Trip Name</label>
            <input
              type="text"
              required
              value={formState.tripName}
              onChange={(e) => onUpdateFields({ tripName: e.target.value })}
              placeholder="e.g. Winter Forts & Lakes Tour"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Starting City</label>
            <input
              type="text"
              required
              value={formState.startingCity}
              onChange={(e) => onUpdateFields({ startingCity: e.target.value })}
              placeholder="e.g. Jaipur or Delhi"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={formState.startDate}
              onChange={(e) => onUpdateFields({ startDate: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Adults</label>
            <input
              type="number"
              min={1}
              max={30}
              value={formState.travellers}
              onChange={(e) => onUpdateFields({ travellers: Number(e.target.value) || 1 })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Children</label>
            <input
              type="number"
              min={0}
              max={20}
              value={formState.children}
              onChange={(e) => onUpdateFields({ children: Number(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Total Days Override</label>
            <input
              type="number"
              min={1}
              max={45}
              value={formState.duration || 1}
              onChange={(e) => onUpdateFields({ duration: Number(e.target.value) || 1 })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Travel Pace</label>
            <select
              value={formState.travelPace}
              onChange={(e) => onUpdateFields({ travelPace: e.target.value })}
              className={inputClass}
            >
              <option value="relaxed">Relaxed (2 highlights/day)</option>
              <option value="balanced">Balanced (3 highlights/day)</option>
              <option value="packed">Packed (4 highlights/day)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Accommodation Tier</label>
            <select
              value={formState.accommodationPreference}
              onChange={(e) => onUpdateFields({ accommodationPreference: e.target.value })}
              className={inputClass}
            >
              <option value="economical">Economical</option>
              <option value="moderate">Moderate</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Transport Mode</label>
            <select
              value={formState.transportPreference}
              onChange={(e) => onUpdateFields({ transportPreference: e.target.value })}
              className={inputClass}
            >
              <option value="public">Public (Rail/Bus/Auto)</option>
              <option value="private_cab">Private Cab</option>
              <option value="self_drive">Self-Drive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Target Budget (INR)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={formState.targetBudget}
            onChange={(e) => onUpdateFields({ targetBudget: Number(e.target.value) || 0 })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Travel Interests</label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_CHIPS.map((interest) => {
              const active = (formState.interests || []).includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize border transition-colors ${
                    active
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Special Notes</label>
          <textarea
            rows={2}
            value={formState.notes}
            onChange={(e) => onUpdateFields({ notes: e.target.value })}
            placeholder="Dietary preferences, senior-friendly pacing, festival dates..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Destination Selector & Reordering */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white">
            2. Selected Destinations ({formState.selectedDestinations.length})
          </h2>
          <select
            value=""
            onChange={(e) => {
              const found = allDestinations.find((d) => d._id === e.target.value);
              if (found) onAddDestination(found);
            }}
            className="rounded-xl border border-amber-500/40 bg-slate-950 px-3 py-2 text-xs font-medium text-amber-300 focus:outline-none"
          >
            <option value="">+ Add Rajasthan Destination...</option>
            {unselected.map((dest) => (
              <option key={dest._id} value={dest._id}>
                {dest.name} ({dest.region} · {dest.recommendedDays}d rec.)
              </option>
            ))}
          </select>
        </div>

        {formState.selectedDestinations.length === 0 ? (
          <p className="text-sm text-slate-400 rounded-xl border border-dashed border-slate-700 p-4 text-center">
            No destinations selected yet. Pick one from the dropdown above or from the Explore page.
          </p>
        ) : (
          <div className="space-y-2.5">
            {formState.selectedDestinations.map((dest, idx) => (
              <div
                key={dest._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-950">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{dest.name}</p>
                    <p className="text-xs text-slate-400">
                      {dest.region} · Rec. {dest.recommendedDays} day(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Days:</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={dest.customDays || dest.recommendedDays || 2}
                    onChange={(e) => onSetDestinationDays(dest._id, e.target.value)}
                    className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-center text-xs text-white"
                  />
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onReorderDestination(idx, -1)}
                    className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:text-white disabled:opacity-30"
                    aria-label={`Move ${dest.name} up`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === formState.selectedDestinations.length - 1}
                    onClick={() => onReorderDestination(idx, 1)}
                    className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:text-white disabled:opacity-30"
                    aria-label={`Move ${dest.name} down`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveDestination(dest._id)}
                    className="rounded-lg border border-rose-500/30 p-1.5 text-rose-400 hover:bg-rose-500/10"
                    aria-label={`Remove ${dest.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting || formState.selectedDestinations.length === 0}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-colors disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" />
        {submitting ? 'Generating Dynamic Itinerary...' : submitLabel}
      </button>
    </form>
  );
}
