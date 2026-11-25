import { AlertTriangle, Info } from 'lucide-react';
import { formatINRRange, capitalize } from '../utils/formatters';

export default function BudgetSummary({ estimate }) {
  if (!estimate) return null;

  const { breakdown = {}, total = {}, perPerson = {}, budgetWarning, assumptions = [] } = estimate;

  const rows = [
    { label: 'Accommodation', data: breakdown.accommodation },
    { label: 'Food & Dining', data: breakdown.food },
    { label: 'Local Transportation', data: breakdown.localTransport },
    { label: 'Intercity Transportation', data: breakdown.intercityTransport },
    { label: 'Activities & Sightseeing', data: breakdown.activities },
  ];

  return (
    <div className="space-y-5">
      {budgetWarning?.exceeded && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4 text-rose-200">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm">{budgetWarning.message}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Total Estimated Expenditure
          </span>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
            {formatINRRange(total.min, total.max)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {estimate.totalDays} day(s) · {estimate.nights} night(s) · {estimate.rooms} room(s) ·{' '}
            {estimate.totalTravellers} traveller(s)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Per-Person Estimate
          </span>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-bold text-emerald-400">
            {formatINRRange(perPerson.min, perPerson.max)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Indicative planning estimate (INR) · {capitalize(estimate.preferences?.accommodationPreference)} stay
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-white">Category-Wise Cost Breakdown</h3>
        </div>
        <div className="divide-y divide-slate-800/80">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-200">{row.label}</p>
                {row.data?.unit && (
                  <p className="text-[11px] text-slate-500">
                    Unit: {row.data.unit.replace(/_/g, ' ')}
                  </p>
                )}
              </div>
              <span className="font-semibold text-slate-100">
                {formatINRRange(row.data?.min, row.data?.max)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {assumptions.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
            <Info className="h-4 w-4" />
            <span>Transparent Planning Assumptions</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
            {assumptions.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
