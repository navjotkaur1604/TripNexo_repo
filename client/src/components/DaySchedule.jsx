import { useState } from 'react';
import { Calendar, Clock, Plus, Trash2, Sun, Sunset, Moon } from 'lucide-react';
import { formatDate, formatINRRange } from '../utils/formatters';

const SLOT_META = [
  { key: 'morning', label: 'Morning', icon: Sun, color: 'text-amber-400' },
  { key: 'afternoon', label: 'Afternoon', icon: Sunset, color: 'text-orange-400' },
  { key: 'evening', label: 'Evening', icon: Moon, color: 'text-indigo-400' },
];

export default function DaySchedule({
  day,
  editable = false,
  onUpdateDay,
}) {
  const [addingSlot, setAddingSlot] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const handleRemoveActivity = (slotKey, index) => {
    if (!onUpdateDay) return;
    const updatedActivities = {
      ...day.activities,
      [slotKey]: (day.activities?.[slotKey] || []).filter((_, i) => i !== index),
    };
    onUpdateDay({ ...day, activities: updatedActivities });
  };

  const handleAddActivity = (slotKey) => {
    if (!newTitle.trim() || !onUpdateDay) return;
    const updatedActivities = {
      ...day.activities,
      [slotKey]: [
        ...(day.activities?.[slotKey] || []),
        {
          title: newTitle.trim(),
          category: 'custom',
          description: 'Custom activity added by traveller',
          durationHours: 2,
          estimatedFeeMin: 0,
          estimatedFeeMax: 0,
        },
      ],
    };
    onUpdateDay({ ...day, activities: updatedActivities });
    setNewTitle('');
    setAddingSlot(null);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/75 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/60 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
            Day {day.dayNumber}
          </span>
          <div>
            <h3 className="text-base font-semibold text-white">{day.destinationName}</h3>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="h-3 w-3" />
              {formatDate(day.date)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
            Est. Day Spend
          </span>
          <span className="text-sm font-semibold text-emerald-400">
            {formatINRRange(day.estimatedCost?.min, day.estimatedCost?.max)}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {SLOT_META.map(({ key, label, icon: Icon, color }) => {
          const items = day.activities?.[key] || [];
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${color}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
                {editable && (
                  <button
                    type="button"
                    onClick={() => setAddingSlot(addingSlot === key ? null : key)}
                    className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add activity
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-slate-500 italic pl-5">Flexible free time</p>
              ) : (
                <div className="space-y-2 pl-2 border-l border-slate-800">
                  {items.map((item, idx) => (
                    <div
                      key={item._id || `${key}-${idx}`}
                      className="flex items-start justify-between gap-3 rounded-xl bg-slate-950/60 border border-slate-800/80 px-3.5 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-100">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.durationHours || 2}h
                          </span>
                          {(item.estimatedFeeMax > 0 || item.estimatedFeeMin > 0) && (
                            <span>
                              Entry est: {formatINRRange(item.estimatedFeeMin, item.estimatedFeeMax)}
                            </span>
                          )}
                        </div>
                      </div>
                      {editable && (
                        <button
                          type="button"
                          onClick={() => handleRemoveActivity(key, idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          aria-label={`Remove ${item.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {editable && addingSlot === key && (
                <div className="flex items-center gap-2 pl-2 pt-1">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={`Add ${label.toLowerCase()} activity...`}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddActivity(key)}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {editable ? (
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-400 mb-1">Day Notes</label>
            <input
              type="text"
              value={day.notes || ''}
              onChange={(e) => onUpdateDay && onUpdateDay({ ...day, notes: e.target.value })}
              placeholder="Add custom reminders for this day..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            />
          </div>
        ) : (
          day.notes && (
            <p className="pt-2 border-t border-slate-800 text-xs text-slate-400">
              <strong className="text-slate-300">Note:</strong> {day.notes}
            </p>
          )
        )}
      </div>
    </div>
  );
}
