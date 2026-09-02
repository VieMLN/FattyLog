import React, { useMemo } from 'react';
import { Card } from './Card';
import { DayData } from '../types';
import { parseNum, calculateWeightStreak } from '../lib/storage';
import { Flame } from 'lucide-react';

/**
 * Props for the CalorieTab component.
 */
interface CalorieTabProps {
  data: DayData;
  referenceDate?: Date;
  updateField: (field: keyof DayData, val: string) => void;
}

/**
 * Props for single numeric calorie input rows.
 */
interface CalorieInputRowProps {
  id?: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
}

/**
 * Standardized input row for meals and energy values.
 */
const CalorieInputRow: React.FC<CalorieInputRowProps> = ({
  id,
  label,
  value,
  placeholder = '0',
  onChange,
}) => (
  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
    <label htmlFor={id} className="text-[13px] text-slate-700 font-medium flex-1 cursor-pointer">
      {label}
    </label>
    <div className="relative flex items-center">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step="any"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-right text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
      />
      <span className="text-[11px] text-slate-400 font-normal ml-1.5 w-6">kcal</span>
    </div>
  </div>
);

/**
 * Kalorien Tab: Tracks meals (Frühstück, Mittag, Abend, Snacks), body metrics (Gewicht, BU),
 * target base calories + training deductions, net balance status, and daily notes.
 */
export const CalorieTab: React.FC<CalorieTabProps> = ({ data, referenceDate, updateField }) => {
  // Current consecutive weigh-in streak
  const weightStreak = useMemo(() => {
    return calculateWeightStreak(referenceDate || new Date());
  }, [referenceDate, data.gewicht]);

  // Compute total intake, overall balance (total - base - training), and deficit status
  const { totalIst, overall, isDeficit } = useMemo(() => {
    const f = parseNum(data.fruehstueck);
    const m = parseNum(data.mittag);
    const a = parseNum(data.abend);
    const s = parseNum(data.snacks);
    const total = f + m + a + s;

    const base = parseNum(data.base);
    const train = parseNum(data.training);
    const diff = total - base - train;

    return {
      totalIst: total,
      overall: diff,
      isDeficit: diff <= 0,
    };
  }, [data.fruehstueck, data.mittag, data.abend, data.snacks, data.base, data.training]);

  return (
    <div className="space-y-3">
      {/* Wiege-Streak (mittig und größer) */}
      {weightStreak > 0 && (
        <div className="flex justify-center -mb-1">
          <div
            id="calorie-streak-badge"
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 border border-amber-200 text-amber-900 rounded-full shadow-2xs"
            title={`${weightStreak} Tage Wiege-Streak`}
          >
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            <span className="text-base font-black text-amber-950">{weightStreak}</span>
          </div>
        </div>
      )}

      {/* Mahlzeiten-Eingabe */}
      <Card id="card-meals" title="Mahlzeiten" icon="🍽">
        <div className="space-y-0.5">
          <CalorieInputRow
            id="input-meal-fruehstueck"
            label="Frühstück"
            value={data.fruehstueck}
            onChange={(v) => updateField('fruehstueck', v)}
          />
          <CalorieInputRow
            id="input-meal-mittag"
            label="Mittagessen"
            value={data.mittag}
            onChange={(v) => updateField('mittag', v)}
          />
          <CalorieInputRow
            id="input-meal-abend"
            label="Abendessen"
            value={data.abend}
            onChange={(v) => updateField('abend', v)}
          />
          <CalorieInputRow
            id="input-meal-snacks"
            label="Snacks"
            value={data.snacks}
            onChange={(v) => updateField('snacks', v)}
          />
        </div>

        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200">
          <span className="text-sm font-bold text-slate-900">Gesamt Ist-kcal:</span>
          <span id="total-ist-calories" className="text-base font-extrabold text-blue-600">
            {totalIst} kcal
          </span>
        </div>
      </Card>

      {/* Körpermetriken */}
      <Card id="card-body" title="Körperdaten" icon="⚖️">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="input-body-gewicht" className="block text-xs font-medium text-slate-600 mb-1">
              Gewicht (kg)
            </label>
            <input
              id="input-body-gewicht"
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="76.5"
              value={data.gewicht}
              onChange={(e) => updateField('gewicht', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label htmlFor="input-body-bu" className="block text-xs font-medium text-slate-600 mb-1">
              Bauchumfang (cm)
            </label>
            <input
              id="input-body-bu"
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="97.5"
              value={data.bu}
              onChange={(e) => updateField('bu', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
            />
          </div>
        </div>
      </Card>

      {/* Tägliche Bilanzrechnung */}
      <Card id="card-balance" title="Tagesbilanz" icon="📊">
        <div className="space-y-0.5">
          <CalorieInputRow
            id="input-balance-base"
            label="Base kcal (Ziel):"
            placeholder="1600"
            value={data.base}
            onChange={(v) => updateField('base', v)}
          />
          <CalorieInputRow
            id="input-balance-training"
            label="Training (kcal):"
            placeholder="0"
            value={data.training}
            onChange={(v) => updateField('training', v)}
          />
        </div>

        <div
          id="box-overall-balance"
          className={`mt-3 p-3.5 rounded-lg flex flex-col items-center justify-center transition-colors ${
            isDeficit ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'
          }`}
        >
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Overall Bilanz:
          </span>
          <span
            id="value-overall-balance"
            className={`text-2xl font-extrabold my-1 ${
              isDeficit ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {overall > 0 ? `+${overall}` : overall} kcal
          </span>
          <span
            className={`text-xs font-medium ${
              isDeficit ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isDeficit ? '✓ Im Zielbereich (Defizit)' : '⚠ Über dem Zielwert'}
          </span>
        </div>
      </Card>

      {/* Notizen */}
      <Card id="card-notes" title="Notizen" icon="📝">
        <textarea
          id="input-notes"
          rows={3}
          placeholder="z.B. Trainingseinheit, Hungergefühl..."
          value={data.notizen}
          onChange={(e) => updateField('notizen', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y placeholder:text-slate-400 leading-relaxed"
        />
      </Card>
    </div>
  );
};

