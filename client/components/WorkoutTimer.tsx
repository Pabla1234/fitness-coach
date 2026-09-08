'use client';

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  ChevronDown, Minus, Pause, Play, Plus, RotateCcw, SkipForward,
  Timer as TimerIcon, Trophy, Vibrate, Volume2, VolumeX, X,
} from 'lucide-react';
import { formatClock, getExerciseTiming, readPB, writePB } from '@/lib/exerciseTiming';

// ─── Types ────────────────────────────────────────────────────────────────────
export type TimerMode = 'hold' | 'countdown';
type Phase = 'idle' | 'prep' | 'work' | 'rest' | 'done';

export interface TimerConfig {
  exercise?: string;
  mode?: TimerMode;
  /** Work duration in seconds. For 'hold' this is the target to beat (optional). */
  target?: number | null;
  rest?: number;
  sets?: number;
}

interface TimerContextValue {
  open: (config?: TimerConfig) => void;
  /** Configure straight from a workout row — picks hold vs rest automatically. */
  openForExercise: (name: string, reps?: unknown, sets?: number) => void;
  isRunning: boolean;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export const useWorkoutTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useWorkoutTimer must be used inside <WorkoutTimerProvider>');
  return ctx;
};

// ─── Audio cues ───────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;

const beep = (freq = 880, ms = 120, gain = 0.18) => {
  try {
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx!.state === 'suspended') audioCtx!.resume();
    const osc = audioCtx!.createOscillator();
    const vol = audioCtx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    vol.gain.setValueAtTime(gain, audioCtx!.currentTime);
    vol.gain.exponentialRampToValueAtTime(0.0001, audioCtx!.currentTime + ms / 1000);
    osc.connect(vol).connect(audioCtx!.destination);
    osc.start();
    osc.stop(audioCtx!.currentTime + ms / 1000);
  } catch { /* audio is a nicety, never a blocker */ }
};

const buzz = (pattern: number | number[]) => {
  try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
};

// ─── Presets ──────────────────────────────────────────────────────────────────
const HOLD_PRESETS  = [15, 20, 30, 45, 60, 90, 120];
const REST_PRESETS  = [30, 45, 60, 90, 120, 180];

const MODE_LABEL: Record<TimerMode, string> = {
  hold:      'Hold (count up)',
  countdown: 'Countdown',
};

// ─── Provider ─────────────────────────────────────────────────────────────────
/**
 * `themeClass` is applied to the timer overlay. The overlay renders outside the
 * app's own `dark` wrapper, so without this it would always look light.
 */
export function WorkoutTimerProvider({ children, themeClass = '' }: { children: React.ReactNode; themeClass?: string }) {
  const [visible, setVisible]       = useState(false);
  const [minimized, setMinimized]   = useState(false);
  const [exercise, setExercise]     = useState('Workout');
  const [mode, setMode]             = useState<TimerMode>('hold');
  const [target, setTarget]         = useState<number | null>(45);
  const [restLen, setRestLen]       = useState(60);
  const [totalSets, setTotalSets]   = useState(3);

  const [phase, setPhase]           = useState<Phase>('idle');
  const [set, setSet]               = useState(1);
  const [elapsed, setElapsed]       = useState(0);      // seconds within the current phase
  const [lastHold, setLastHold]     = useState<number | null>(null);
  const [pb, setPb]                 = useState(0);
  const [beatPB, setBeatPB]         = useState(false);

  const [sound, setSound]           = useState(true);
  const [vibrate, setVibrate]       = useState(true);
  /** Mirrors the `running` ref so the Pause/Resume button re-renders. */
  const [ticking, setTicking]       = useState(false);

  // Drift-free clock: we measure against wall time, never accumulate ticks.
  const startedAt   = useRef(0);
  const accumulated = useRef(0);
  const running     = useRef(false);
  const rafId       = useRef<number | null>(null);
  const intervalId  = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef     = useRef<() => boolean>(() => true);
  const cued        = useRef<Set<number>>(new Set());
  const wakeLock    = useRef<any>(null);

  const soundRef   = useRef(sound);
  const vibrateRef = useRef(vibrate);
  useEffect(() => { soundRef.current = sound; }, [sound]);
  useEffect(() => { vibrateRef.current = vibrate; }, [vibrate]);

  const cue = useCallback((freq: number, ms: number, pattern: number | number[]) => {
    if (soundRef.current) beep(freq, ms);
    if (vibrateRef.current) buzz(pattern);
  }, []);

  // ── Screen wake lock so the phone doesn't sleep mid-hold ──
  const acquireWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && !wakeLock.current) {
        wakeLock.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch { /* unsupported — fine */ }
  }, []);

  const releaseWakeLock = useCallback(() => {
    try { wakeLock.current?.release?.(); } catch { /* ignore */ }
    wakeLock.current = null;
  }, []);

  // ── Engine ──
  // rAF drives the smooth display, but browsers suspend it in background tabs —
  // so a setInterval runs the same tick as a backstop. Both read the wall clock,
  // so whichever fires, the time and the phase changes stay correct.
  const stopLoop = useCallback(() => {
    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    rafId.current = null;
    if (intervalId.current !== null) clearInterval(intervalId.current);
    intervalId.current = null;
    running.current = false;
    setTicking(false);
  }, []);

  const runLoop = useCallback((frame: () => void) => {
    running.current = true;
    setTicking(true);
    rafId.current = requestAnimationFrame(frame);
    if (intervalId.current !== null) clearInterval(intervalId.current);
    intervalId.current = setInterval(() => {
      if (running.current) tickRef.current();
    }, 250);
  }, []);

  const phaseDuration = useCallback((p: Phase): number | null => {
    if (p === 'prep') return 3;
    if (p === 'rest') return restLen;
    if (p === 'work') return mode === 'hold' ? null : target;
    return null;
  }, [mode, restLen, target]);

  const phaseRef = useRef<Phase>('idle');
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const advanceRef = useRef<() => void>(() => {});

  /** One update. Returns true if the phase ended (so the caller stops driving). */
  const tick = useCallback((): boolean => {
    if (!running.current) return true;
    const secs = (accumulated.current + (performance.now() - startedAt.current)) / 1000;
    setElapsed(secs);

    const p = phaseRef.current;
    const dur = phaseDuration(p);

    if (dur !== null) {
      const remaining = dur - secs;
      // 3-2-1 countdown cues, fired once each
      for (const mark of [3, 2, 1]) {
        if (remaining <= mark && remaining > mark - 1 && !cued.current.has(mark)) {
          cued.current.add(mark);
          cue(p === 'prep' ? 660 : 880, 110, 90);
        }
      }
      if (remaining <= 0) {
        advanceRef.current();
        return true;
      }
    } else if (p === 'work' && mode === 'hold') {
      // Open-ended hold: mark every 30s, and celebrate passing the PB
      const mark = Math.floor(secs / 30);
      if (mark > 0 && !cued.current.has(1000 + mark)) {
        cued.current.add(1000 + mark);
        cue(760, 90, 60);
      }
      if (pb > 0 && secs >= pb && !cued.current.has(9999)) {
        cued.current.add(9999);
        setBeatPB(true);
        cue(1180, 220, [80, 60, 140]);
      }
      if (target && secs >= target && !cued.current.has(8888)) {
        cued.current.add(8888);
        cue(1046, 200, [60, 50, 120]);
      }
    }

    return false;
  }, [cue, mode, pb, phaseDuration, target]);

  useEffect(() => { tickRef.current = tick; }, [tick]);

  const loop = useCallback(() => {
    if (!running.current) return;
    const phaseEnded = tickRef.current();
    // startPhase() schedules the next frame itself when a phase ends
    if (!phaseEnded && running.current) rafId.current = requestAnimationFrame(loop);
  }, []);

  const startPhase = useCallback((p: Phase) => {
    stopLoop();
    cued.current = new Set();
    accumulated.current = 0;
    startedAt.current = performance.now();
    setElapsed(0);
    setPhase(p);
    phaseRef.current = p;
    if (p === 'idle' || p === 'done') return;
    runLoop(loop);
  }, [loop, runLoop, stopLoop]);

  /** Called when a timed phase hits zero, or the user finishes a hold. */
  const advance = useCallback(() => {
    const p = phaseRef.current;

    if (p === 'prep') {
      cue(1046, 200, 160);
      startPhase('work');
      return;
    }

    if (p === 'work') {
      cue(523, 420, [140, 80, 140]);
      const isLast = set >= totalSets;
      if (isLast) {
        stopLoop();
        setPhase('done');
        phaseRef.current = 'done';
        releaseWakeLock();
      } else {
        setSet(s => s + 1);
        startPhase('rest');
      }
      return;
    }

    if (p === 'rest') {
      cue(880, 260, 140);
      startPhase('work');
    }
  }, [cue, releaseWakeLock, set, startPhase, stopLoop, totalSets]);

  useEffect(() => { advanceRef.current = advance; }, [advance]);

  // ── Controls ──
  const start = useCallback(() => {
    acquireWakeLock();
    setBeatPB(false);
    setLastHold(null);
    setSet(1);
    startPhase('prep');
  }, [acquireWakeLock, startPhase]);

  const pause = useCallback(() => {
    if (!running.current) return;
    accumulated.current += performance.now() - startedAt.current;
    stopLoop();
    setElapsed(accumulated.current / 1000);
  }, [stopLoop]);

  const resume = useCallback(() => {
    if (running.current || phase === 'idle' || phase === 'done') return;
    startedAt.current = performance.now();
    runLoop(loop);
  }, [loop, phase, runLoop]);

  const reset = useCallback(() => {
    stopLoop();
    releaseWakeLock();
    accumulated.current = 0;
    cued.current = new Set();
    setElapsed(0);
    setSet(1);
    setPhase('idle');
    phaseRef.current = 'idle';
    setBeatPB(false);
    setLastHold(null);
  }, [releaseWakeLock, stopLoop]);

  /** Finish an open-ended hold: bank the time, check the PB, move to rest. */
  const finishHold = useCallback(() => {
    const held = Math.floor(elapsed);
    setLastHold(held);
    if (exercise && held > 0) {
      const isRecord = writePB(exercise, held);
      if (isRecord) {
        setPb(held);
        setBeatPB(true);
      }
    }
    advance();
  }, [advance, elapsed, exercise]);

  const adjust = useCallback((delta: number) => {
    setTarget(t => Math.max(5, (t ?? 30) + delta));
  }, []);

  // ── Public API ──
  const setRest = useCallback((v: number) => setRestLen(Math.max(5, v)), []);

  const open = useCallback((config: TimerConfig = {}) => {
    reset();
    const name = config.exercise || 'Workout';
    setExercise(name);
    setPb(readPB(name));
    if (config.mode) setMode(config.mode);
    if (config.target !== undefined) setTarget(config.target);
    if (config.rest !== undefined) setRest(config.rest);
    if (config.sets !== undefined) setTotalSets(Math.max(1, config.sets));
    setMinimized(false);
    setVisible(true);
  }, [reset, setRest]);

  const openForExercise = useCallback((name: string, reps?: unknown, sets?: number) => {
    const timing = getExerciseTiming(name, reps);
    open({
      exercise: name,
      mode: timing.isHold ? 'hold' : 'countdown',
      target: timing.isHold ? timing.target : 60,
      sets: sets && sets > 0 ? sets : 3,
      rest: timing.isHold ? 60 : 90,
    });
  }, [open]);

  const close = useCallback(() => {
    reset();
    setVisible(false);
    setMinimized(false);
  }, [reset]);

  // Pause automatically if the tab is hidden for a long time? No — holds should
  // keep counting. But do re-acquire the wake lock when coming back.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible' && running.current) acquireWakeLock(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [acquireWakeLock]);

  useEffect(() => () => { stopLoop(); releaseWakeLock(); }, [releaseWakeLock, stopLoop]);

  const isActive = phase !== 'idle' && phase !== 'done';
  const ctxValue = useMemo<TimerContextValue>(
    () => ({ open, openForExercise, isRunning: isActive }),
    [open, openForExercise, isActive],
  );

  // ── Display maths ──
  const dur = phaseDuration(phase);
  const countingDown = dur !== null;
  const display = countingDown ? Math.max(0, dur - elapsed) : elapsed;
  const ringTarget = phase === 'work' && mode === 'hold' ? (target ?? Math.max(pb, 60)) : dur ?? 60;
  const progress = ringTarget > 0
    ? Math.min(1, (countingDown ? elapsed : elapsed) / ringTarget)
    : 0;

  const phaseColor =
    phase === 'rest' ? '#10b981' :
    phase === 'prep' ? '#f59e0b' :
    phase === 'done' ? '#8b5cf6' : '#6366f1';

  const phaseLabel =
    phase === 'prep' ? 'Get ready' :
    phase === 'rest' ? 'Rest' :
    phase === 'done' ? 'Complete' :
    phase === 'work' ? (mode === 'hold' ? 'Hold' : 'Work') : 'Ready';

  return (
    <TimerContext.Provider value={ctxValue}>
      {children}

      <div className={themeClass}>
      {/* ── Minimised pill ── */}
      {visible && minimized && (
        <button
          onClick={() => setMinimized(false)}
          className="fixed bottom-5 right-5 z-[190] flex items-center gap-3 pl-4 pr-5 py-3 rounded-full shadow-2xl text-white font-bold text-sm transition-transform hover:scale-105 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${phaseColor}, #7c3aed)` }}
        >
          <TimerIcon size={18} className={isActive ? 'animate-pulse' : ''} />
          <span className="tabular-nums text-base">
            {mode === 'hold' && phase === 'work' ? formatClock(display) : formatClock(Math.ceil(display))}
          </span>
          <span className="text-[10px] uppercase tracking-wider opacity-80">{phaseLabel}</span>
        </button>
      )}

      {/* ── Full timer ── */}
      {visible && !minimized && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-[#0a0d18] sm:rounded-3xl rounded-t-3xl border border-slate-200 dark:border-indigo-900/40 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/60">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                  {MODE_LABEL[mode]} timer
                </p>
                <h3 className="font-bold text-slate-900 dark:text-white truncate">{exercise}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setSound(s => !s)} aria-label="Toggle sound"
                  className={`p-2 rounded-xl transition-colors ${sound ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} hover:bg-slate-100 dark:hover:bg-slate-800`}>
                  {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
                </button>
                <button onClick={() => setVibrate(v => !v)} aria-label="Toggle vibration"
                  className={`p-2 rounded-xl transition-colors ${vibrate ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} hover:bg-slate-100 dark:hover:bg-slate-800`}>
                  <Vibrate size={17} />
                </button>
                <button onClick={() => setMinimized(true)} aria-label="Minimise timer"
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ChevronDown size={18} />
                </button>
                <button onClick={close} aria-label="Close timer"
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-5 py-5 space-y-5">

              {/* Mode switch — only meaningful before you start */}
              {phase === 'idle' && (
                <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
                  {(['hold', 'countdown'] as TimerMode[]).map(m => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                        mode === m
                          ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'
                      }`}>
                      {MODE_LABEL[m]}
                    </button>
                  ))}
                </div>
              )}

              {/* Ring */}
              <div className="relative mx-auto" style={{ width: 232, height: 232 }}>
                <svg width="232" height="232" viewBox="0 0 232 232" className="-rotate-90">
                  <circle cx="116" cy="116" r="104" fill="none" strokeWidth="12"
                    className="stroke-slate-100 dark:stroke-slate-800" />
                  <circle cx="116" cy="116" r="104" fill="none" strokeWidth="12" strokeLinecap="round"
                    stroke={phaseColor}
                    strokeDasharray={2 * Math.PI * 104}
                    strokeDashoffset={2 * Math.PI * 104 * (1 - progress)}
                    style={{ transition: 'stroke-dashoffset 120ms linear, stroke 300ms ease' }} />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: phaseColor }}>
                    {phaseLabel}
                  </span>
                  <span className="text-5xl font-extrabold tabular-nums text-slate-900 dark:text-white leading-none mt-1">
                    {phase === 'work' && mode === 'hold'
                      ? formatClock(display)
                      : formatClock(Math.ceil(display))}
                  </span>
                  {phase === 'work' && mode === 'hold' && (
                    <span className="text-lg font-bold tabular-nums text-slate-400 dark:text-slate-500">
                      .{Math.floor((display % 1) * 10)}
                    </span>
                  )}
                  {totalSets > 1 && phase !== 'idle' && (
                    <span className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Set {Math.min(set, totalSets)} of {totalSets}
                    </span>
                  )}
                  {phase === 'idle' && target && (
                    <span className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Target {formatClock(target)}
                    </span>
                  )}
                </div>
              </div>

              {/* PB + last hold */}
              {mode === 'hold' && (
                <div className="flex items-center justify-center gap-4 text-xs">
                  {pb > 0 && (
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                      <Trophy size={13} /> Best {formatClock(pb)}
                    </span>
                  )}
                  {lastHold !== null && (
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Last hold {formatClock(lastHold)}
                    </span>
                  )}
                  {beatPB && (
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 animate-pulse">
                      New personal best! 🎉
                    </span>
                  )}
                </div>
              )}

              {/* Setup — hidden once running so the display stays clean */}
              {phase === 'idle' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {mode === 'hold' ? 'Hold target' : 'Work time'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => adjust(-15)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                          <Minus size={13} />
                        </button>
                        <span className="w-14 text-center text-sm font-bold tabular-nums text-slate-800 dark:text-white">
                          {target ? formatClock(target) : 'Open'}
                        </span>
                        <button onClick={() => adjust(15)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {HOLD_PRESETS.map(p => (
                        <button key={p} onClick={() => setTarget(p)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            target === p
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                          }`}>
                          {p}s
                        </button>
                      ))}
                      {mode === 'hold' && (
                        <button onClick={() => setTarget(null)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            target === null
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                          }`}>
                          Max
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rest between sets</span>
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {REST_PRESETS.map(p => (
                        <button key={p} onClick={() => setRest(p)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            restLen === p
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                          }`}>
                          {formatClock(p)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sets</span>
                    <div className="flex gap-1.5 mt-2">
                      {[1, 2, 3, 4, 5, 6].map(s => (
                        <button key={s} onClick={() => setTotalSets(s)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold border transition-colors ${
                            totalSets === s
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {phase === 'done' && (
                <div className="text-center py-2">
                  <p className="text-lg font-extrabold text-slate-800 dark:text-white">Session complete 💪</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {totalSets} {totalSets === 1 ? 'set' : 'sets'} of {exercise}
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-2.5">
              {phase === 'idle' && (
                <button onClick={start}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-transform active:scale-95">
                  <Play size={17} /> Start
                </button>
              )}

              {isActive && (
                <>
                  <button onClick={reset} aria-label="Reset"
                    className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <RotateCcw size={17} />
                  </button>

                  {ticking ? (
                    <button onClick={pause}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm transition-transform active:scale-95">
                      <Pause size={17} /> Pause
                    </button>
                  ) : (
                    <button onClick={resume}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-transform active:scale-95">
                      <Play size={17} /> Resume
                    </button>
                  )}

                  {phase === 'work' && mode === 'hold' ? (
                    <button onClick={finishHold}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-transform active:scale-95">
                      Done set
                    </button>
                  ) : (
                    <button onClick={() => advanceRef.current()} aria-label="Skip"
                      className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <SkipForward size={17} />
                    </button>
                  )}
                </>
              )}

              {phase === 'done' && (
                <>
                  <button onClick={reset}
                    className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm">
                    Again
                  </button>
                  <button onClick={close}
                    className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm">
                    Finish
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </TimerContext.Provider>
  );
}

// ─── Small launch button for exercise rows ────────────────────────────────────
export const TimerButton = ({
  exercise, reps, sets, className = '', compact = false,
}: { exercise: string; reps?: unknown; sets?: number; className?: string; compact?: boolean }) => {
  const { openForExercise } = useWorkoutTimer();
  const timing = getExerciseTiming(exercise, reps);

  return (
    <button
      onClick={() => openForExercise(exercise, reps, sets)}
      className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-transform active:scale-95 ${
        compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
      } ${
        timing.isHold
          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/25'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      } ${className}`}
    >
      <TimerIcon size={compact ? 12 : 14} />
      {timing.isHold ? (timing.target ? `Hold ${timing.target}s` : 'Hold timer') : 'Rest timer'}
    </button>
  );
};
