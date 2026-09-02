import React, { useMemo, useState } from 'react';
import { Card } from './Card';
import { WeightChart } from './WeightChart';
import { WeightCalendarView } from './WeightCalendarView';
import { DayStat, Habit } from '../types';
import { calculateHabitStreak, calculateWeightStreak } from '../lib/storage';
import { Flame, Calendar, LineChart, TrendingDown, TrendingUp, Minus } from 'lucide-react';

/**
 * Props for the StatsTab component.
 */
interface StatsTabProps {
  statsData: DayStat[];
  habitList: Habit[];
  referenceDate?: Date;
  onSelectDate?: (date: Date) => void;
}

/**
 * Stats Tab: Displays weight trends across 7 days (chart, 7-day diff, average, daily breakdown),
 * monthly calendar view with streak highlights, active weigh-in streak, and habit success rates.
 */
export const StatsTab: React.FC<StatsTabProps> = ({
  statsData,
  habitList,
  referenceDate,
  onSelectDate,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'calendar'>('chart');

  // Calculate streaks for all habits
  const habitStreaks = useMemo(() => {
    const streaks: Record<string, number> = {};
    habitList.forEach((habit) => {
      streaks[habit.id] = calculateHabitStreak(habit.id, referenceDate || new Date());
    });
    return streaks;
  }, [habitList, referenceDate, statsData]);

  // Calculate current weight streak
  const weightStreak = useMemo(() => {
    return calculateWeightStreak(referenceDate || new Date());
  }, [referenceDate, statsData]);

  // Calculate weight change over the 7 days (first valid weight to latest valid weight) and average
  const { weightChange, averageWeight } = useMemo(() => {
    const validEntries = statsData
      .map((d, index) => ({ weight: d.weight, dayLabel: d.dayLabel, index }))
      .filter((d): d is { weight: number; dayLabel: string; index: number } => d.weight !== null);

    const avg =
      validEntries.length > 0
        ? (validEntries.reduce((acc, curr) => acc + curr.weight, 0) / validEntries.length).toFixed(1)
        : null;

    if (validEntries.length < 2) {
      return { weightChange: null, averageWeight: avg };
    }

    const firstEntry = validEntries[0]; // oldest in the 7 days
    const lastEntry = validEntries[validEntries.length - 1]; // latest
    const diff = Number((lastEntry.weight - firstEntry.weight).toFixed(2));

    return {
      averageWeight: avg,
      weightChange: {
        diff,
        isLoss: diff < 0,
        isGain: diff > 0,
        isNeutral: diff === 0,
        firstVal: firstEntry.weight,
        lastVal: lastEntry.weight,
        daysSpan: lastEntry.index - firstEntry.index + 1,
      },
    };
  }, [statsData]);

  return (
    <div className="space-y-3">
      {/* Diagramm, Kalenderansicht & 7-Tage-Differenz für Körpergewicht */}
      <Card id="card-weight-stats" className="pb-3">
        {/* Header with Title and Mode Switch Button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-1.5">
              <span>⚖️</span>
              <span>Gewichtsverlauf</span>
            </h2>
            {weightStreak > 0 && (
              <span
                id="weight-streak-badge"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-xs bg-amber-100/90 text-amber-800 border border-amber-300/80 shadow-2xs"
                title={`${weightStreak} Tage Wiege-Streak`}
              >
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{weightStreak}</span>
              </span>
            )}
          </div>

          {/* Toggle View Mode Button */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              id="btn-view-chart"
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'chart'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>7 Tage</span>
            </button>
            <button
              type="button"
              id="btn-view-calendar"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
          </div>
        </div>

        {/* View Mode Content */}
        {viewMode === 'chart' ? (
          <div>
            {/* 7-Tage-Gewichtsveränderung & Durchschnittsgewicht */}
            <div className="mb-3">
              {weightChange ? (
                <div
                  id="weight-change-badge"
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    weightChange.isLoss
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : weightChange.isGain
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        weightChange.isLoss
                          ? 'bg-emerald-100 text-emerald-700'
                          : weightChange.isGain
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {weightChange.isLoss ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : weightChange.isGain ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">
                        {weightChange.isLoss
                          ? `${Math.abs(weightChange.diff)} kg abgenommen`
                          : weightChange.isGain
                          ? `${weightChange.diff} kg zugenommen`
                          : 'Gewicht unverändert'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        in den letzten 7 Tagen ({weightChange.firstVal} kg → {weightChange.lastVal} kg)
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-extrabold ${
                        weightChange.isLoss
                          ? 'text-emerald-700'
                          : weightChange.isGain
                          ? 'text-amber-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {weightChange.diff > 0 ? `+${weightChange.diff}` : `${weightChange.diff}`} kg
                    </span>
                    {averageWeight && (
                      <span className="block text-[10px] text-slate-500 font-medium">
                        Ø {averageWeight} kg
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500">
                  <span>Trage mindestens 2 Werte ein für die 7-Tage-Differenz</span>
                  {averageWeight && (
                    <span className="font-bold text-blue-600">Ø {averageWeight} kg</span>
                  )}
                </div>
              )}
            </div>

            <WeightChart statsData={statsData} />

            <div className="mt-3 border-t border-slate-100 pt-2 divide-y divide-slate-100">
              {statsData.map((day, idx) => {
                const gewicht = day.data.gewicht ? `${day.data.gewicht} kg` : '-';
                const bu = day.data.bu ? ` (BU: ${day.data.bu} cm)` : '';
                return (
                  <div
                    key={idx}
                    id={`stat-row-day-${idx}`}
                    className="flex items-center justify-between py-1.5 text-xs cursor-pointer hover:bg-slate-50 px-1 rounded transition-colors"
                    onClick={() => {
                      if (onSelectDate) {
                        const targetDate = new Date(referenceDate || new Date());
                        targetDate.setDate(targetDate.getDate() - (6 - idx));
                        onSelectDate(targetDate);
                      }
                    }}
                    title="Diesen Tag im Kalorien-Tracker öffnen"
                  >
                    <span className="text-slate-500 font-medium">{day.dateStr}</span>
                    <span className="font-bold text-slate-800">
                      {gewicht}
                      {bu}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <WeightCalendarView initialDate={referenceDate} onSelectDate={onSelectDate} />
        )}
      </Card>

      {/* Erfüllungsquoten der Gewohnheiten & Streaks */}
      <Card id="card-habit-stats" title="Habit-Erfolgsquote & Streaks" icon="✅">
        {habitList.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-xs">
            Keine Habits für die Statistik vorhanden.
          </div>
        ) : (
          <div className="space-y-3">
            {habitList.map((habit) => {
              let count = 0;
              statsData.forEach((day) => {
                if (day.data.habitsCompleted && day.data.habitsCompleted[habit.id]) {
                  count++;
                }
              });
              const percent = Math.round((count / 7) * 100);
              const streak = habitStreaks[habit.id] || 0;

              return (
                <div key={habit.id} id={`habit-stat-${habit.id}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{habit.title}</span>
                      {/* Streak Badge with Fire Icon (only visible if streak > 0) */}
                      {streak > 0 && (
                        <span
                          id={`habit-streak-${habit.id}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] bg-amber-100 text-amber-800 border border-amber-300/80 shadow-2xs transition-colors"
                          title={`${streak} Tage aktiver Streak`}
                        >
                          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600 animate-pulse" />
                          <span>{streak} {streak === 1 ? 'Tag' : 'Tage'}</span>
                        </span>
                      )}
                    </div>

                    <span className="font-bold text-blue-600">
                      {count} / 7 ({percent}%)
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

