import { useState, useEffect, useMemo, useCallback } from 'react';
import { ActiveTab, DayData, Habit, DayStat, INITIAL_DAY_STATE } from './types';
import {
  formatDateKey,
  parseNum,
  loadHabitList,
  saveHabitList,
  loadDayData,
  saveDayData,
} from './lib/storage';
import { DateHeader } from './components/DateHeader';
import { CalorieTab } from './components/CalorieTab';
import { HabitsTab } from './components/HabitsTab';
import { StatsTab } from './components/StatsTab';
import { TabBar } from './components/TabBar';

/**
 * Root Application Component.
 * Orchestrates central date selection, persistent daily storage synchronization,
 * habit configurations, and seamless navigation across Calories, Habits, and Stats tabs.
 */
export default function App() {
  // Navigation & Date State
  const [activeTab, setActiveTab] = useState<ActiveTab>('calories');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [habitList, setHabitList] = useState<Habit[]>(() => loadHabitList());

  const dateKey = useMemo(() => formatDateKey(currentDate), [currentDate]);
  const [dayData, setDayData] = useState<DayData>(() => loadDayData(dateKey));

  // Load day data whenever dateKey changes
  useEffect(() => {
    setDayData(loadDayData(dateKey));
  }, [dateKey]);

  // Update a single field in day data and persist to localStorage
  const updateField = useCallback(
    (field: keyof DayData, val: string) => {
      setDayData((prev) => {
        const next = { ...prev, [field]: val };
        saveDayData(dateKey, next);
        return next;
      });
    },
    [dateKey]
  );

  // Toggle habit completion checkbox for the current day
  const toggleHabit = useCallback(
    (habitId: string) => {
      setDayData((prev) => {
        const nextHabits = {
          ...prev.habitsCompleted,
          [habitId]: !prev.habitsCompleted[habitId],
        };
        const next = { ...prev, habitsCompleted: nextHabits };
        saveDayData(dateKey, next);
        return next;
      });
    },
    [dateKey]
  );

  // Add new habit and save to persistent storage
  const handleAddHabit = useCallback(
    (title: string) => {
      const updated = [...habitList, { id: Date.now().toString(), title }];
      setHabitList(updated);
      saveHabitList(updated);
    },
    [habitList]
  );

  // Delete habit and save updated list to persistent storage
  const handleDeleteHabit = useCallback(
    (habitId: string) => {
      const updated = habitList.filter((h) => h.id !== habitId);
      setHabitList(updated);
      saveHabitList(updated);
    },
    [habitList]
  );

  // Shift current day forwards or backwards by numeric offset
  const handleDayShift = useCallback((offset: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset);
      return next;
    });
  }, []);

  // Set explicit date from picker or calendar click
  const handleDateSelect = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  // Compute 7-day trailing statistics (weights and habits) ending on the current date
  const statsData: DayStat[] = useMemo(() => {
    const days: DayStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - i);
      const k = formatDateKey(d);
      const data = k === dateKey ? dayData : loadDayData(k);
      const gewichtVal = data.gewicht ? parseNum(data.gewicht) : null;

      days.push({
        dateStr: d.toLocaleDateString('de-DE', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        }),
        dayLabel: d.toLocaleDateString('de-DE', { weekday: 'short' }),
        weight: gewichtVal === 0 ? null : gewichtVal,
        data,
      });
    }
    return days;
  }, [currentDate, dateKey, dayData]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between items-center">
      <main className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col shadow-lg border-x border-slate-200">
        {/* Fester Datums-Header */}
        <DateHeader
          currentDate={currentDate}
          onDayChange={handleDayShift}
          onDateSelect={handleDateSelect}
        />

        {/* Scrollbarer Hauptinhalt */}
        <div className="flex-1 p-3.5 pb-6 overflow-y-auto">
          {activeTab === 'calories' && (
            <CalorieTab
              data={dayData || INITIAL_DAY_STATE}
              referenceDate={currentDate}
              updateField={updateField}
            />
          )}
          {activeTab === 'habits' && (
            <HabitsTab
              habitList={habitList}
              habitsCompleted={dayData?.habitsCompleted || {}}
              referenceDate={currentDate}
              onToggle={toggleHabit}
              onAdd={handleAddHabit}
              onDelete={handleDeleteHabit}
            />
          )}
          {activeTab === 'stats' && (
            <StatsTab
              statsData={statsData}
              habitList={habitList}
              referenceDate={currentDate}
              onSelectDate={(selectedDate) => {
                handleDateSelect(selectedDate);
                setActiveTab('calories');
              }}
            />
          )}
        </div>

        {/* Untere Tab-Menüleiste */}
        <TabBar activeTab={activeTab} onSelectTab={setActiveTab} />
      </main>
    </div>
  );
}

