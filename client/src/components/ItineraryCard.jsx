import { Link } from 'react-router-dom';
import { Calendar, Copy, Edit3, Eye, FileDown, MapPin, Trash2, Users } from 'lucide-react';
import { formatDate, formatINRRange, capitalize } from '../utils/formatters';

export default function ItineraryCard({
  trip,
  onDuplicate,
  onDelete,
  onDownloadPdf,
  onOpenInPlanner,
}) {
  const destinationNames = (trip.destinations || [])
    .map((d) => d.destinationId?.name)
    .filter(Boolean);

  return (
    <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/75 p-5 shadow-lg hover:border-amber-500/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-block rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
            {capitalize(trip.status || 'planned')}
          </span>
          <h3 className="mt-2 font-display text-xl font-bold text-white">{trip.tripName}</h3>
        </div>
        <div className="text-right">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
            Est. Budget
          </span>
          <span className="text-sm font-bold text-emerald-400">
            {formatINRRange(trip.estimatedCost?.min, trip.estimatedCost?.max)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-amber-400" />
          {formatDate(trip.startDate)} · {trip.duration} day(s)
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-amber-400" />
          {trip.travellers} adult(s){trip.children ? `, ${trip.children} child` : ''}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-300">
        <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
        <span>
          {trip.startingCity} → {destinationNames.join(' → ') || 'Rajasthan'}
        </span>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
        <Link
          to={`/my-trips/${trip._id}`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Link>
        <button
          type="button"
          onClick={() => onOpenInPlanner(trip)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-amber-500/40"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit in Planner
        </button>
        <button
          type="button"
          onClick={() => onDownloadPdf(trip)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-500"
        >
          <FileDown className="h-3.5 w-3.5" />
          PDF
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(trip._id)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-500"
          title="Duplicate Trip"
        >
          <Copy className="h-3.5 w-3.5" />
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => onDelete(trip)}
          className="ml-auto inline-flex items-center gap-1 rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </article>
  );
}
