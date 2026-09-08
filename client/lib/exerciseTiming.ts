// ─── Exercise timing helpers ──────────────────────────────────────────────────
// Works out whether an exercise is held for time (planche, dead hang, plank…)
// and what the prescribed duration is, so the timer can configure itself.

export interface ParsedDuration {
  /** Lower bound in seconds, if the prescription is a range */
  min: number | null;
  /** The duration the timer should target, in seconds. null = open-ended hold */
  target: number | null;
  /** Original text we parsed from */
  raw: string;
}

/** Exercises that are held rather than repped, matched as substrings (lowercase). */
export const ISOMETRIC_KEYWORDS = [
  'planche',
  'front lever',
  'back lever',
  'human flag',
  'dead hang',
  'deadhang',
  'bar hang',
  'passive hang',
  'active hang',
  'l-sit',
  'l sit',
  'lsit',
  'tuck sit',
  'plank',
  'hollow',
  'superman hold',
  'wall sit',
  'handstand',
  'crow pose',
  'chin-up hold',
  'chin up hold',
  'iso hold',
  'isometric',
  'static hold',
  'bridge hold',
  'glute bridge hold',
  'farmer carry',
  'farmers carry',
  'farmer walk',
  'wall angel hold',
  'dead bug hold',
  'boat pose',
  'horse stance',
];

/** True when the exercise itself is a hold (regardless of what reps say). */
export const isIsometric = (name: string): boolean => {
  const n = (name || '').toLowerCase();
  return ISOMETRIC_KEYWORDS.some(k => n.includes(k));
};

/**
 * Parse a reps prescription into seconds.
 * Handles: "30-60 sec", "45s", "1 min", "2 minutes", "hold 30 seconds",
 * "max hold", "AMRAP", "60".
 */
export const parseDuration = (reps: unknown): ParsedDuration | null => {
  if (reps === null || reps === undefined) return null;
  const raw = String(reps).trim();
  if (!raw) return null;
  const text = raw.toLowerCase();

  // Open-ended holds — count up with no target
  if (/(max|amrap|as long as|to failure|failure)/.test(text)) {
    return { min: null, target: null, raw };
  }

  const hasTimeUnit = /(sec|secs|second|seconds|min|mins|minute|minutes|hold|\d+\s*s\b)/.test(text);
  if (!hasTimeUnit) return null;

  const toMinutes = /(min|mins|minute|minutes)/.test(text);
  const numbers = (text.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter(n => n > 0);
  if (numbers.length === 0) return { min: null, target: null, raw };

  const scale = toMinutes ? 60 : 1;
  const values = numbers.map(n => Math.round(n * scale));
  const min = values.length > 1 ? Math.min(...values) : null;
  const target = Math.max(...values);

  return { min, target, raw };
};

/**
 * Everything the timer needs for a given exercise.
 * `mode` is what the button should launch by default.
 */
export interface ExerciseTiming {
  isHold: boolean;
  /** Seconds to count down / target to beat. null on open-ended holds. */
  target: number | null;
  min: number | null;
  label: string;
  raw: string | null;
}

export const getExerciseTiming = (name: string, reps?: unknown): ExerciseTiming => {
  const parsed = parseDuration(reps);
  const hold = isIsometric(name) || !!parsed;

  return {
    isHold: hold,
    target: parsed?.target ?? null,
    min: parsed?.min ?? null,
    label: hold ? 'Hold Timer' : 'Rest Timer',
    raw: parsed?.raw ?? null,
  };
};

/** Stable key for storing a personal best against an exercise. */
export const pbKey = (name: string) =>
  'guripro.pb.' + (name || 'exercise').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const readPB = (name: string): number => {
  if (typeof window === 'undefined') return 0;
  const v = Number(window.localStorage.getItem(pbKey(name)));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

export const writePB = (name: string, seconds: number): boolean => {
  if (typeof window === 'undefined') return false;
  const current = readPB(name);
  if (seconds > current) {
    window.localStorage.setItem(pbKey(name), String(Math.floor(seconds)));
    return true;
  }
  return false;
};

/** 95 → "1:35", 3725 → "62:05" */
export const formatClock = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
};
