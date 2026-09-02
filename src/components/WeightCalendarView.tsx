import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { loadDayData, formatDateKey, parseNum, calculateWeightStreakOnDate } from '../lib/storage';

/**
 * Props for the WeightCalendarView component.
 */
interface WeightCalendarViewProps {
  initialDate?: Date;
  onSelectDate?: (date: Date) => void;
}

/**
 * Monthly calendar overview displaying daily logged weights, streak badges for consecutive weigh-ins,
 * and quick navigation into any historical day's tracker.
 */
export const WeightCalendarView: React.FC<WeightCalendarViewProps> = ({
  initialDate = new Date(),
  onSelectDate,
}) => {
  const [viewDate, setViewDate] = useState<Date>(() => new Date(initialDate));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Localized German month name (e.g. "September 2026")
  const monthName = useMemo(() => {
    return viewDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  }, [viewDate]);

  // Month navigation actions
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setViewDate(new Date());
  };

  // Build days matrix for the month including leading and trailing padding cells
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Monday as first day of week (0: Sun -> 6, 1: Mon -> 0, etc.)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const cells: Array<{
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      weight: number | null;
      streakDay: number;
      bu: string | null;
    }> = [];

    const todayStr = formatDateKey(new Date());

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const k = formatDateKey(d);
      const data = loadDayData(k);
      const w = data.gewicht ? parseNum(data.gewicht) : null;
      const validWeight = w === 0 ? null : w;
      const streak = validWeight !== null ? calculateWeightStreakOnDate(d) : 0;

      cells.push({
        date: d,
        dateKey: k,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: k === todayStr,
        weight: validWeight,
        streakDay: streak,
        bu: data.bu || null,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const k = formatDateKey(d);
      const data = loadDayData(k);
      const w = data.gewicht ? parseNum(data.gewicht) : null;
      const validWeight = w === 0 ? null : w;
      const streak = validWeight !== null ? calculateWeightStreakOnDate(d) : 0;

      cells.push({
        date: d,
        dateKey: k,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: k === todayStr,
        weight: validWeight,
        streakDay: streak,
        bu: data.bu || null,
      });
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      const k = formatDateKey(d);
      const data = loadDayData(k);
      const w = data.gewicht ? parseNum(data.gewicht) : null;
      const validWeight = w === 0 ? null : w;
      const streak = validWeight !== null ? calculateWeightStreakOnDate(d) : 0;

      cells.push({
        date: d,
        dateKey: k,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: k === todayStr,
        weight: validWeight,
        streakDay: streak,
        bu: data.bu || null,
      });
    }

    return cells;
  }, [year, month]);

  const weekHeaders = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div id="weight-calendar-view" className="space-y-3 pt-1">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2">
        <button
          type="button"
          id="btn-calendar-prev-month"
          onClick={handlePrevMonth}
          className="p-1 rounded-md hover:bg-slate-200 active:scale-95 text-slate-700 transition-all"
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 capitalize">{monthName}</span>
          <button
            type="button"
            onClick={handleToday}
            className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
          >
            Heute
          </button>
        </div>

        <button
          type="button"
          id="btn-calendar-next-month"
          onClick={handleNextMonth}
          className="p-1 rounded-md hover:bg-slate-200 active:scale-95 text-slate-700 transition-all"
          aria-label="Nächster Monat"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {weekHeaders.map((h, i) => (
            <div key={i}>{h}</div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 text-center">
          {calendarCells.map((cell, idx) => {
            const hasWeight = cell.weight !== null;

            return (
              <button
                type="button"
                key={idx}
                id={`calendar-day-${cell.dateKey}`}
                onClick={() => onSelectDate && onSelectDate(cell.date)}
                className={`min-h-[56px] p-1 flex flex-col justify-between items-center transition-all ${
                  cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 opacity-40'
                } ${
                  cell.isToday
                    ? 'ring-2 ring-amber-500 ring-inset z-10'
                    : cell.streakDay > 0
                    ? 'hover:bg-amber-50/30'
                    : 'hover:bg-slate-50'
                }`}
                title={`${cell.dateKey}: ${
                  hasWeight
                    ? `${cell.weight} kg (Streak Tag ${cell.streakDay})`
                    : 'Kein Gewichtseintrag'
                }`}
              >
                {/* Day number & Streak Day Badge */}
                <div className="w-full flex items-center justify-between px-0.5">
                  <span
                    className={`text-[10px] font-semibold ${
                      cell.isToday
                        ? 'text-amber-700 font-bold bg-amber-100 rounded px-1'
                        : cell.isCurrentMonth
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {cell.streakDay > 0 && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-amber-700 bg-amber-100/90 border border-amber-300/80 rounded px-1"
                      title={`${cell.streakDay}. Streak-Tag`}
                    >
                      <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                      <span>{cell.streakDay}</span>
                    </span>
                  )}
                </div>

                {/* Weight value or empty state */}
                <div className="my-auto py-0.5 w-full">
                  {hasWeight ? (
                    <div
                      className={`rounded py-0.5 px-0.5 border shadow-2xs ${
                        cell.streakDay > 0
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`block text-[10px] font-extrabold leading-tight ${
                          cell.streakDay > 0 ? 'text-amber-800' : 'text-slate-700'
                        }`}
                      >
                        {cell.weight}
                      </span>
                    </div>
                  ) : (
                    <span className="block text-[9px] text-slate-300 font-medium">-</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend & Hint */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-50 border border-amber-200 inline-block" />
            <span>Gewicht</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 fill-amber-500 text-amber-500 inline-block" />
            <span>Streak</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span>Tippen zum Öffnen</span>
        </div>
      </div>
    </div>
  );
};

