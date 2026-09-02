/**
 * Core types, interfaces, and constants for the FattyLog tracking application.
 */

/**
 * Represents an individual habit / daily goal.
 */
export interface Habit {
  id: string;
  title: string;
}

/**
 * Daily log state structure storing nutrition, body metrics, exercise, and habit statuses.
 */
export interface DayData {
  fruehstueck: string;
  mittag: string;
  abend: string;
  snacks: string;
  notizen: string;
  gewicht: string;
  bu: string;
  training: string;
  base: string;
  habitsCompleted: Record<string, boolean>;
}

/**
 * 7-Day statistics item combining date information and logged weight.
 */
export interface DayStat {
  dateStr: string;
  dayLabel: string;
  weight: number | null;
  data: DayData;
}

/**
 * Default preset habits provided for new users.
 */
export const DEFAULT_HABITS: Habit[] = [
  { id: '1', title: 'TypeClub' },
  { id: '2', title: 'Boot.dev' },
  { id: '3', title: 'Learn' },
  { id: '4', title: 'Weight' },
  { id: '5', title: 'Train' },
];

/**
 * Initial empty state for a newly initialized day.
 */
export const INITIAL_DAY_STATE: DayData = {
  fruehstueck: '',
  mittag: '',
  abend: '',
  snacks: '',
  notizen: '',
  gewicht: '',
  bu: '',
  training: '',
  base: '1600',
  habitsCompleted: {},
};

/**
 * Keys used for localStorage persistence.
 */
export const STORAGE_KEYS = {
  HABIT_LIST: 'user_habit_list',
  DAY_PREFIX: 'tracker_',
} as const;

/**
 * Navigation tabs available in the application.
 */
export type ActiveTab = 'calories' | 'habits' | 'stats';

