import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

/**
 * Props for the sticky DateHeader navigation bar.
 */
interface DateHeaderProps {
  currentDate: Date;
  onDayChange: (offset: number) => void;
  onDateSelect?: (newDate: Date) => void;
}

/**
 * Sticky header component providing single-day backward/forward steps,
 * a visual "Heute" tag, and an integrated native date picker popup.
 */
export const DateHeader: React.FC<DateHeaderProps> = ({ currentDate, onDayChange, onDateSelect }) => {
  // Format displayed German localized date string (e.g., "Di., 01.09.2026")
  const formatted = useMemo(() => {
    return currentDate.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, [currentDate]);

  // Check if active viewed date is today's real calendar date
  const isToday = useMemo(() => {
    const today = new Date();
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  }, [currentDate]);

  // Value for the invisible HTML5 date input element (YYYY-MM-DD)
  const dateInputValue = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-3.5 py-2.5 flex items-center justify-between shadow-xs">
      {/* Previous Day Button */}
      <button
        id="btn-prev-day"
        onClick={() => onDayChange(-1)}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-blue-600 font-bold text-xs rounded-lg transition-all"
        aria-label="Vorheriger Tag"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Gestern</span>
      </button>

      {/* Date Display and Native DatePicker Overlay */}
      <div className="flex items-center gap-2 relative">
        <label htmlFor="date-picker-input" className="cursor-pointer flex items-center gap-1.5">
          <span className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">
            {formatted}
          </span>
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
        </label>
        <input
          id="date-picker-input"
          type="date"
          value={dateInputValue}
          onChange={(e) => {
            if (e.target.value && onDateSelect) {
              const [y, m, d] = e.target.value.split('-').map(Number);
              onDateSelect(new Date(y, m - 1, d));
            }
          }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
          title="Datum auswählen"
        />
        {isToday && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
            Heute
          </span>
        )}
      </div>

      {/* Next Day Button */}
      <button
        id="btn-next-day"
        onClick={() => onDayChange(1)}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-blue-600 font-bold text-xs rounded-lg transition-all"
        aria-label="Nächster Tag"
      >
        <span>Morgen</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </header>
  );
};

