import { DayData, Habit, DEFAULT_HABITS, INITIAL_DAY_STATE, STORAGE_KEYS } from '../types';

/**
 * Safely parses a string or number input into a numeric value.
 * Handles comma as decimal separator (e.g., German notation "78,5" -> 78.5).
 * Returns 0 if invalid or empty.
 *
 * @param val - The raw input value to parse
 * @returns Parsed number or 0
 */
export const parseNum = (val: string | number | null | undefined): number => {
  if (val === null || val === undefined || val === '') return 0;
  const normalized = String(val).replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};

/**
 * Formats a Date object into a YYYY-MM-DD storage key.
 *
 * @param date - The Date instance to format
 * @returns Formatted key string (e.g., "2026-09-01")
 */
export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Loads the user's custom habit list from localStorage.
 * Falls back to DEFAULT_HABITS if none found or on parse failure.
 *
 * @returns Array of habits
 */
export const loadHabitList = (): Habit[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HABIT_LIST);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading habit list from localStorage:', err);
  }
  return DEFAULT_HABITS;
};

/**
 * Persists the habit list to localStorage.
 *
 * @param list - Array of habits to save
 */
export const saveHabitList = (list: Habit[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.HABIT_LIST, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving habit list to localStorage:', err);
  }
};

/**
 * Loads the daily tracking data for a specific date key.
 * Merges loaded values with INITIAL_DAY_STATE for backward-compatible property guarantees.
 *
 * @param dateKey - Formatted date key (YYYY-MM-DD)
 * @returns DayData object
 */
export const loadDayData = (dateKey: string): DayData => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.DAY_PREFIX}${dateKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_DAY_STATE,
        ...parsed,
        habitsCompleted: parsed.habitsCompleted || {},
      };
    }
  } catch (err) {
    console.error(`Error loading day data for ${dateKey}:`, err);
  }
  return { ...INITIAL_DAY_STATE };
};

/**
 * Persists daily tracking data for a specific date key to localStorage.
 *
 * @param dateKey - Formatted date key (YYYY-MM-DD)
 * @param data - DayData object to save
 */
export const saveDayData = (dateKey: string, data: DayData): void => {
  try {
    localStorage.setItem(`${STORAGE_KEYS.DAY_PREFIX}${dateKey}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving day data for ${dateKey}:`, err);
  }
};

/**
 * Internal helper to count consecutive days backwards where a condition holds true.
 *
 * @param startDate - The starting Date to step backwards from
 * @param predicate - Function returning boolean for given day's data
 * @returns Number of consecutive days meeting condition
 */
const countConsecutiveBackward = (
  startDate: Date,
  predicate: (data: DayData) => boolean
): number => {
  let count = 0;
  const cursor = new Date(startDate);

  while (true) {
    const key = formatDateKey(cursor);
    const data = loadDayData(key);
    if (predicate(data)) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return count;
};

/**
 * Generic active streak calculator for a reference date.
 * If met on referenceDate, streak counts back from referenceDate.
 * If not met today, checks yesterday to keep streak active until end of current day.
 *
 * @param referenceDate - Target date for streak evaluation
 * @param predicate - Validation condition
 * @returns Active streak count
 */
const calculateActiveStreak = (
  referenceDate: Date,
  predicate: (data: DayData) => boolean
): number => {
  const todayKey = formatDateKey(referenceDate);
  const todayData = loadDayData(todayKey);

  if (predicate(todayData)) {
    return countConsecutiveBackward(referenceDate, predicate);
  }

  // If not met today, check yesterday
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);
  const yesterdayData = loadDayData(yesterdayKey);

  if (predicate(yesterdayData)) {
    return countConsecutiveBackward(yesterday, predicate);
  }

  return 0;
};

/**
 * Calculates current streak for an individual habit.
 *
 * @param habitId - Unique ID of the habit
 * @param referenceDate - The reference date (defaults to now)
 * @returns Consecutive active streak count in days
 */
export const calculateHabitStreak = (
  habitId: string,
  referenceDate: Date = new Date()
): number => {
  return calculateActiveStreak(referenceDate, (data) =>
    Boolean(data.habitsCompleted?.[habitId])
  );
};

/**
 * Checks if a DayData object contains a valid positive weight entry.
 *
 * @param data - Daily tracking data
 * @returns True if weight is greater than 0
 */
export const hasValidWeight = (data: DayData): boolean => {
  if (!data || !data.gewicht) return false;
  const num = parseNum(data.gewicht);
  return num > 0;
};

/**
 * Calculates current weighing streak (consecutive days with logged weight).
 *
 * @param referenceDate - The reference date (defaults to now)
 * @returns Consecutive days weigh-in streak
 */
export const calculateWeightStreak = (referenceDate: Date = new Date()): number => {
  return calculateActiveStreak(referenceDate, hasValidWeight);
};

/**
 * Calculates historical streak sequence ending on a specific calendar date.
 * Returns 0 if no weight was logged on that specific date.
 *
 * @param date - The specific calendar date
 * @returns Streak count ending on that day
 */
export const calculateWeightStreakOnDate = (date: Date): number => {
  const currentKey = formatDateKey(date);
  const currentData = loadDayData(currentKey);

  if (!hasValidWeight(currentData)) {
    return 0;
  }

  return countConsecutiveBackward(date, hasValidWeight);
};


