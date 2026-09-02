/**
 * @file App.js
 * @description All-in-One Kalorien- und Gewohnheitstracker (Habits/Todos) mit 7-Tage-Statistik.
 * @platform Android / iOS (Optimiert für Google Pixel & native Bildschirmskalierungen)
 * @standards React Functional Components, Hooks (useCallback, useMemo, useEffect), AsyncStorage
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// 1. KONSTANTEN & DATENSTRUKTUREN
// ==========================================

/**
 * Standard-Gewohnheiten, falls noch keine im Speicher vorhanden sind.
 */
const DEFAULT_HABITS = [
  { id: '1', title: 'TypeClub' },
  { id: '2', title: 'Boot.dev' },
  { id: '3', title: 'Learn' },
  { id: '4', title: 'Weight' },
  { id: '5', title: 'Train' },
];

/**
 * Standard-Datenmodell für einen einzelnen Tag.
 */
const INITIAL_DAY_STATE = {
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

const STORAGE_KEYS = {
  HABIT_LIST: 'user_habit_list',
  DAY_PREFIX: 'tracker_',
};

// ==========================================
// 2. HILFSFUNKTIONEN (UTILITIES)
// ==========================================

/**
 * Konvertiert Strings mit Komma oder Punkt sicher in Gleitkommazahlen.
 * @param {string|number} val - Eingabewert
 * @returns {number} Gültige Zahl oder 0
 */
const parseNum = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const normalized = String(val).replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};

/**
 * Erzeugt einen standardisierten ISO-Datumsschlüssel im Format YYYY-MM-DD.
 * @param {Date} date - Das zu formatierende Datum
 * @returns {string} Formatierter Datumsschlüssel
 */
const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ==========================================
// 3. CUSTOM HOOKS
// ==========================================

/**
 * Custom Hook zur Verwaltung des Lebenszyklus und der Persistenz von Tagesdaten.
 * @param {Date} currentDate - Aktuell ausgewähltes Datum
 */
function useDayData(currentDate) {
  const dateKey = useMemo(() => formatDateKey(currentDate), [currentDate]);
  const [data, setData] = useState(INITIAL_DAY_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // Daten für den aktuellen Tag asynchron laden
  useEffect(() => {
    let isMounted = true;

    const loadDayData = async () => {
      setIsLoading(true);
      try {
        const raw = await AsyncStorage.getItem(`${STORAGE_KEYS.DAY_PREFIX}${dateKey}`);
        if (isMounted) {
          if (raw) {
            const parsed = JSON.parse(raw);
            setData({
              ...INITIAL_DAY_STATE,
              ...parsed,
              habitsCompleted: parsed.habitsCompleted || {},
            });
          } else {
            setData(INITIAL_DAY_STATE);
          }
        }
      } catch (error) {
        console.error(`[AsyncStorage] Fehler beim Laden von ${dateKey}:`, error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDayData();

    return () => {
      isMounted = false;
    };
  }, [dateKey]);

  // Ein einzelnes Datenfeld aktualisieren und persistent speichern
  const updateField = useCallback(
    async (field, val) => {
      setData((prev) => {
        const next = { ...prev, [field]: val };
        AsyncStorage.setItem(
          `${STORAGE_KEYS.DAY_PREFIX}${dateKey}`,
          JSON.stringify(next)
        ).catch((err) => console.error(`[AsyncStorage] Fehler beim Speichern:`, err));
        return next;
      });
    },
    [dateKey]
  );

  // Status einer Gewohnheit umschalten (Toggle Checkbox)
  const toggleHabit = useCallback(
    (habitId) => {
      setData((prev) => {
        const nextHabits = {
          ...prev.habitsCompleted,
          [habitId]: !prev.habitsCompleted[habitId],
        };
        const next = { ...prev, habitsCompleted: nextHabits };
        AsyncStorage.setItem(
          `${STORAGE_KEYS.DAY_PREFIX}${dateKey}`,
          JSON.stringify(next)
        ).catch((err) => console.error(`[AsyncStorage] Fehler beim Speichern von Habits:`, err));
        return next;
      });
    },
    [dateKey]
  );

  return { data, updateField, toggleHabit, isLoading, dateKey };
}

// ==========================================
// 4. PRÄSENTATIONSKOMPONENTEN (UI)
// ==========================================

/**
 * Wiederverwendbare Karten-Komponente für strukturierte Oberflächen.
 */
const Card = ({ title, icon, children }) => (
  <View style={styles.card}>
    {title && (
      <Text style={styles.sectionHeader}>
        {icon ? `${icon} ` : ''}
        {title}
      </Text>
    )}
    {children}
  </View>
);

/**
 * Zeile zur Zahleneingabe für Mahlzeiten und Kalorienwerte.
 */
const CalorieInputRow = ({ label, value, onChange }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.numInput}
      placeholder="0"
      placeholderTextColor="#a0aec0"
      keyboardType="decimal-pad"
      value={String(value ?? '')}
      onChangeText={onChange}
    />
  </View>
);

/**
 * Header-Komponente zur Navigation zwischen den Kalendertagen.
 */
const DateHeader = ({ currentDate, onDayChange }) => {
  const formatted = useMemo(() => {
    return currentDate.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, [currentDate]);

  return (
    <View style={styles.topNav}>
      <TouchableOpacity
        onPress={() => onDayChange(-1)}
        style={styles.navBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Vorheriger Tag">
        <Text style={styles.navBtnText}>◀ Gestern</Text>
      </TouchableOpacity>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ backgroundColor: '#FFE600', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
          <Text style={{ color: '#000000', fontWeight: 'bold', fontSize: 11 }}>TEST</Text>
        </View>
        <Text style={styles.dateTitle}>{formatted}</Text>
      </View>
      
      <TouchableOpacity
        onPress={() => onDayChange(1)}
        style={styles.navBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Nächster Tag">
        <Text style={styles.navBtnText}>Morgen ▶</Text>
      </TouchableOpacity>
    </View>
  );
};

// ==========================================
// 5. SEKTIONS-VIEWS (TABS)
// ==========================================

/**
 * TAB 1: Kalorientracker, Mahlzeiten und Tagesbilanz.
 */
const CalorieTab = ({ data, updateField }) => {
  // Automatische Neuberechnung der Kalorienbilanz bei Datenänderung
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
    <View>
      {/* Mahlzeiten-Eingabe */}
      <Card title="Mahlzeiten" icon="🍽">
        <CalorieInputRow
          label="Frühstück"
          value={data.fruehstueck}
          onChange={(t) => updateField('fruehstueck', t)}
        />
        <CalorieInputRow
          label="Mittagessen"
          value={data.mittag}
          onChange={(t) => updateField('mittag', t)}
        />
        <CalorieInputRow
          label="Abendessen"
          value={data.abend}
          onChange={(t) => updateField('abend', t)}
        />
        <CalorieInputRow
          label="Snacks"
          value={data.snacks}
          onChange={(t) => updateField('snacks', t)}
        />

        <View style={[styles.row, styles.divider]}>
          <Text style={styles.totalLabel}>Gesamt Ist-kcal:</Text>
          <Text style={styles.totalValue}>{totalIst} kcal</Text>
        </View>
      </Card>

      {/* Körpermetriken */}
      <Card title="Körperdaten" icon="⚖️">
        <View style={styles.inlineRow}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={styles.subLabel}>Gewicht (kg)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="76.5"
              placeholderTextColor="#a0aec0"
              keyboardType="decimal-pad"
              value={String(data.gewicht ?? '')}
              onChangeText={(t) => updateField('gewicht', t)}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={styles.subLabel}>Bauchumfang (cm)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="97.5"
              placeholderTextColor="#a0aec0"
              keyboardType="decimal-pad"
              value={String(data.bu ?? '')}
              onChangeText={(t) => updateField('bu', t)}
            />
          </View>
        </View>
      </Card>

      {/* Tägliche Bilanzrechnung */}
      <Card title="Tagesbilanz" icon="📊">
        <CalorieInputRow
          label="Base kcal (Ziel):"
          value={data.base}
          onChange={(t) => updateField('base', t)}
        />
        <CalorieInputRow
          label="Training (kcal):"
          value={data.training}
          onChange={(t) => updateField('training', t)}
        />

        <View style={[styles.resultBox, isDeficit ? styles.defizitBg : styles.surplusBg]}>
          <Text style={styles.resultLabel}>Overall Bilanz:</Text>
          <Text style={[styles.resultValue, { color: isDeficit ? '#2e7d32' : '#c62828' }]}>
            {overall > 0 ? `+${overall}` : overall} kcal
          </Text>
          <Text style={styles.resultSub}>
            {isDeficit ? '✓ Im Zielbereich (Defizit)' : '⚠ Über dem Zielwert'}
          </Text>
        </View>
      </Card>

      {/* Notizen */}
      <Card title="Notizen" icon="📝">
        <TextInput
          style={[styles.textInput, styles.notesArea]}
          placeholder="z.B. Trainingseinheit, Hungergefühl..."
          placeholderTextColor="#a0aec0"
          multiline
          value={data.notizen ?? ''}
          onChangeText={(t) => updateField('notizen', t)}
        />
      </Card>
    </View>
  );
};

/**
 * TAB 2: Dynamische Liste täglicher Gewohnheiten und Aufgaben.
 */
const HabitsTab = ({ habitList, habitsCompleted, onToggle, onAdd, onDelete }) => {
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAdd(newTitle.trim());
    setNewTitle('');
  };

  return (
    <Card title="Tägliche Habits & To-Dos" icon="✅">
      {habitList.map((habit) => {
        const isChecked = Boolean(habitsCompleted[habit.id]);
        return (
          <View key={habit.id} style={styles.habitRow}>
            <TouchableOpacity
              style={styles.habitCheckboxArea}
              onPress={() => onToggle(habit.id)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked }}>
              <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                {isChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.habitText, isChecked && styles.habitTextDone]}>
                {habit.title}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDelete(habit.id)}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`Lösche Habit ${habit.title}`}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Eingabefeld für neue Gewohnheiten */}
      <View style={styles.addHabitRow}>
        <TextInput
          style={[styles.textInput, { flex: 1, marginRight: 8 }]}
          placeholder="Neues Habit / Todo..."
          placeholderTextColor="#a0aec0"
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <TouchableOpacity onPress={handleAdd} style={styles.primaryBtn} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>+ Neu</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

/**
 * Leichtgewichtiges Liniendiagramm für den Gewichtsverlauf über die Tage.
 */
const WeightChart = ({ statsData }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const chartHeight = 90;

  const validWeights = useMemo(
    () => statsData.map((d) => d.weight).filter((w) => w !== null),
    [statsData]
  );

  if (validWeights.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Trage Gewichtsdaten ein, um den Verlauf zu sehen.</Text>
      </View>
    );
  }

  const min = Math.min(...validWeights);
  const max = Math.max(...validWeights);
  const range = max - min === 0 ? 1 : max - min;

  // X- und Y-Koordinaten für jeden Datenpunkt berechnen
  const points = statsData.map((item, idx) => {
    const colWidth = containerWidth / (statsData.length || 1);
    const x = colWidth * idx + colWidth / 2;

    let y = null;
    if (item.weight !== null) {
      // Y: 0 ist oben, chartHeight ist unten (15px Padding oben/unten)
      const ratio = (item.weight - min) / range;
      y = chartHeight - 15 - ratio * (chartHeight - 30);
    }

    return { ...item, x, y };
  });

  return (
    <View
      style={styles.chartContainer}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      
      {/* Zeichenfläche für Linien & Punkte */}
      <View style={[styles.chartCanvas, { height: chartHeight }]}>
        {containerWidth > 0 &&
          points.map((p1, idx) => {
            if (idx === points.length - 1) return null;
            const p2 = points[idx + 1];

            // Verbindungslinie nur zeichnen, wenn beide Tage Werte haben
            if (p1.y !== null && p2.y !== null) {
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);

              return (
                <View
                  key={`line-${idx}`}
                  style={[
                    styles.chartLineSegment,
                    {
                      width: length,
                      left: p1.x,
                      top: p1.y,
                      transform: [
                        { translateX: 0 },
                        { translateY: -1 },
                        { rotateZ: `${angle}deg` },
                      ],
                    },
                  ]}
                />
              );
            }
            return null;
          })}

        {/* Punkte & Wertebeschriftung */}
        {containerWidth > 0 &&
          points.map((p, idx) => {
            if (p.y === null) return null;
            return (
              <React.Fragment key={`point-${idx}`}>
                <Text style={[styles.chartPointValue, { left: p.x - 20, top: p.y - 18 }]}>
                  {p.weight}
                </Text>
                <View style={[styles.chartDot, { left: p.x - 4, top: p.y - 4 }]} />
              </React.Fragment>
            );
          })}
      </View>

      {/* X-Achse Beschriftung (Wochentage) */}
      <View style={styles.chartDaysRow}>
        {statsData.map((item, idx) => (
          <View key={idx} style={styles.chartDayCol}>
            <Text style={styles.chartDayLabel}>{item.dayLabel}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * TAB 3: Statistiken über Körpermetriken und Gewohnheits-Erfüllungsquoten.
 */
const StatsTab = ({ statsData, habitList }) => {
  return (
    <View>
      {/* Diagramm & Tabelle für Körpergewicht */}
      <Card title="Gewichtsverlauf (7 Tage)" icon="⚖️">
        <WeightChart statsData={statsData} />

        <View style={styles.statsTable}>
          {statsData.map((day, idx) => {
            const gewicht = day.data.gewicht ? `${day.data.gewicht} kg` : '-';
            const bu = day.data.bu ? ` (BU: ${day.data.bu} cm)` : '';
            return (
              <View key={idx} style={styles.statRow}>
                <Text style={styles.statDate}>{day.dateStr}</Text>
                <Text style={styles.statValue}>
                  {gewicht}
                  {bu}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Erfüllungsquoten der Gewohnheiten */}
      <Card title="Habit-Erfolgsquote (7 Tage)" icon="✅">
        {habitList.map((habit) => {
          let count = 0;
          statsData.forEach((day) => {
            if (day.data.habitsCompleted && day.data.habitsCompleted[habit.id]) {
              count++;
            }
          });
          const percent = Math.round((count / 7) * 100);

          return (
            <View key={habit.id} style={{ marginBottom: 12 }}>
              <View style={styles.statRow}>
                <Text style={styles.habitStatTitle}>{habit.title}</Text>
                <Text style={styles.habitStatCount}>
                  {count} / 7 ({percent}%)
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
};

// ==========================================
// 6. HAUPTKOMPONENTE (APP-ROOT)
// ==========================================

export default function App() {
  const [activeTab, setActiveTab] = useState('calories'); // 'calories' | 'habits' | 'stats'
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data, updateField, toggleHabit } = useDayData(currentDate);

  const [habitList, setHabitList] = useState(DEFAULT_HABITS);
  const [statsData, setStatsData] = useState([]);

  // Globale Habit-Konfiguration laden
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.HABIT_LIST)
      .then((res) => {
        if (res) setHabitList(JSON.parse(res));
      })
      .catch((err) => console.error('[AsyncStorage] Fehler beim Laden der Habit-Liste:', err));
  }, []);

  // Aggregierte 7-Tage-Statistikdaten laden
  useEffect(() => {
    if (activeTab !== 'stats') return;

    let isMounted = true;

    const fetchStats = async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - i);
        const k = formatDateKey(d);

        try {
          const raw = await AsyncStorage.getItem(`${STORAGE_KEYS.DAY_PREFIX}${k}`);
          const parsed = raw ? JSON.parse(raw) : null;
          const gewichtVal = parsed && parsed.gewicht ? parseNum(parsed.gewicht) : null;

          days.push({
            dateStr: d.toLocaleDateString('de-DE', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
            }),
            dayLabel: d.toLocaleDateString('de-DE', { weekday: 'short' }),
            weight: gewichtVal === 0 ? null : gewichtVal,
            data: parsed || {},
          });
        } catch (e) {
          console.error(`[AsyncStorage] Fehler beim Laden von Tag ${k}:`, e);
        }
      }
      if (isMounted) setStatsData(days);
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [activeTab, currentDate]);

  // Neues Habit persistent speichern
  const handleAddHabit = useCallback(
    async (title) => {
      const updated = [...habitList, { id: Date.now().toString(), title }];
      setHabitList(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.HABIT_LIST, JSON.stringify(updated));
    },
    [habitList]
  );

  // Habit löschen und persistent aktualisieren
  const handleDeleteHabit = useCallback(
    async (habitId) => {
      const updated = habitList.filter((h) => h.id !== habitId);
      setHabitList(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.HABIT_LIST, JSON.stringify(updated));
    },
    [habitList]
  );

  // Datum vor- oder zurücksetzen
  const handleDayShift = useCallback((offset) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset);
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        
        {/* Fester Datums-Header */}
        <DateHeader currentDate={currentDate} onDayChange={handleDayShift} />

        {/* Scrollbarer Hauptinhalt */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {activeTab === 'calories' && <CalorieTab data={data} updateField={updateField} />}
          {activeTab === 'habits' && (
            <HabitsTab
              habitList={habitList}
              habitsCompleted={data.habitsCompleted || {}}
              onToggle={toggleHabit}
              onAdd={handleAddHabit}
              onDelete={handleDeleteHabit}
            />
          )}
          {activeTab === 'stats' && <StatsTab statsData={statsData} habitList={habitList} />}
        </ScrollView>

        {/* Untere Tab-Menüleiste */}
        <View style={styles.tabBar}>
          {[
            { key: 'calories', icon: '🍽', label: 'Kalorien' },
            { key: 'habits', icon: '✅', label: 'Habits' },
            { key: 'stats', icon: '📊', label: 'Statistik' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}>
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 7. STYLESHEET
// ==========================================

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 20,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaedf1',
  },
  navBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#edf2f7',
    borderRadius: 8,
  },
  navBtnText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a202c',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1.5,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    borderTopWidth: 1,
    borderColor: '#edf2f7',
    paddingTop: 10,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    color: '#4a5568',
    fontWeight: '500',
    flex: 1,
  },
  subLabel: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '500',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#1a202c',
  },
  numInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 80,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
  },
  notesArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a202c',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#007AFF',
  },
  resultBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  defizitBg: {
    backgroundColor: '#e8f5e9',
  },
  surplusBg: {
    backgroundColor: '#ffebee',
  },
  resultLabel: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 2,
  },
  resultSub: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  habitCheckboxArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  habitText: {
    fontSize: 14,
    color: '#2d3748',
    fontWeight: '500',
    flex: 1,
  },
  habitTextDone: {
    textDecorationLine: 'line-through',
    color: '#a0aec0',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    color: '#e53e3e',
    fontSize: 14,
    fontWeight: '700',
  },
  addHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  statsTable: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
    paddingTop: 6,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statDate: {
    fontSize: 12,
    color: '#718096',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d3748',
  },
  habitStatTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3748',
  },
  habitStatCount: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#edf2f7',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38a169',
    borderRadius: 3,
  },
  chartContainer: {
    paddingVertical: 10,
    width: '100%',
  },
  chartCanvas: {
    position: 'relative',
    width: '100%',
  },
  chartLineSegment: {
    position: 'absolute',
    height: 2.5,
    backgroundColor: '#007AFF',
    transformOrigin: 'left center',
  },
  chartDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  chartPointValue: {
    position: 'absolute',
    width: 40,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: '#007AFF',
  },
  chartDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
    paddingTop: 6,
    marginTop: 4,
  },
  chartDayCol: {
    flex: 1,
    alignItems: 'center',
  },
  chartDayLabel: {
    fontSize: 10,
    color: '#718096',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#a0aec0',
    fontSize: 12,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eaedf1',
    paddingVertical: 6,
    paddingBottom: Platform.OS === 'android' ? 10 : 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabButtonActive: {
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
    marginTop: -2,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 1,
  },
  tabText: {
    fontSize: 11,
    color: '#a0aec0',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
});
