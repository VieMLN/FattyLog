import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { Habit } from '../types';
import { calculateHabitStreak } from '../lib/storage';
import { Check, X, Plus, Flame } from 'lucide-react';

/**
 * Props for the HabitsTab component.
 */
interface HabitsTabProps {
  habitList: Habit[];
  habitsCompleted: Record<string, boolean>;
  referenceDate?: Date;
  onToggle: (habitId: string) => void;
  onAdd: (title: string) => void;
  onDelete: (habitId: string) => void;
}

/**
 * Habits Tab: Displays checklist of daily habits/tasks, their active streaks,
 * toggling completion state, and managing custom habit creations/deletions.
 */
export const HabitsTab: React.FC<HabitsTabProps> = ({
  habitList,
  habitsCompleted,
  referenceDate,
  onToggle,
  onAdd,
  onDelete,
}) => {
  const [newTitle, setNewTitle] = useState('');

  // Calculate streak for each habit based on reference date
  const streaks = useMemo(() => {
    const res: Record<string, number> = {};
    habitList.forEach((h) => {
      res[h.id] = calculateHabitStreak(h.id, referenceDate || new Date());
    });
    return res;
  }, [habitList, referenceDate, habitsCompleted]);

  // Form submit handler to add new habit
  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;
    onAdd(newTitle.trim());
    setNewTitle('');
  };

  return (
    <Card id="card-habits" title="Tägliche Habits & To-Dos" icon="✅">
      <div className="divide-y divide-slate-100">
        {habitList.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-sm">
            Keine Habits eingetragen. Erstelle unten ein neues Habit!
          </div>
        ) : (
          habitList.map((habit) => {
            const isChecked = Boolean(habitsCompleted[habit.id]);
            const streak = streaks[habit.id] || 0;

            return (
              <div
                key={habit.id}
                id={`habit-row-${habit.id}`}
                className="flex items-center justify-between py-2.5 group transition-colors"
              >
                {/* Habit Toggle Button */}
                <button
                  type="button"
                  onClick={() => onToggle(habit.id)}
                  className="flex items-center gap-2.5 flex-1 text-left cursor-pointer select-none"
                  aria-pressed={isChecked}
                  aria-label={`Habit ${habit.title} umschalten`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isChecked
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 bg-white group-hover:border-blue-400'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-sm font-medium transition-all ${
                      isChecked ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {habit.title}
                  </span>
                  {streak > 0 && (
                    <span
                      id={`daily-streak-badge-${habit.id}`}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold ml-1"
                      title={`${streak} Tage Streak`}
                    >
                      <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{streak}</span>
                    </span>
                  )}
                </button>

                {/* Delete Habit Button */}
                <button
                  type="button"
                  id={`btn-delete-habit-${habit.id}`}
                  onClick={() => onDelete(habit.id)}
                  className="p-1 text-slate-300 hover:text-rose-600 active:scale-90 transition-all rounded"
                  title="Habit löschen"
                  aria-label={`Lösche Habit ${habit.title}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Eingabefeld für neue Gewohnheiten */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
        <input
          id="input-new-habit"
          type="text"
          placeholder="Neues Habit / Todo..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
        />
        <button
          type="submit"
          id="btn-add-habit"
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2.5 rounded-lg transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Neu</span>
        </button>
      </form>
    </Card>
  );
};

