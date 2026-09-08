'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquareText,
  Dumbbell,
  Flame,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Send,
  MoreHorizontal,
  Bell,
  Search,
  User,
  Activity,
  Utensils,
  Moon,
  Sun,
  ArrowRight,
  CheckCircle2,
  Circle,
  TrendingDown,
  X,
  Loader2,
  Pencil,
  Save,
  Youtube,
  ClipboardCheck,
  Scale,
  Leaf,
  Beef,
  BookOpen,
  Target,
  Zap,
  Filter,
  Timer as TimerIcon,
  Square,
  RefreshCw,
  Users,
} from 'lucide-react';
import YouTubePlayer, { YouTubeThumb, watchUrl } from '@/components/YouTubePlayer';
import {
  WorkoutTimerProvider, TimerButton, useWorkoutTimer,
} from '@/components/WorkoutTimer';
import { getExerciseTiming } from '@/lib/exerciseTiming';
import CommunityView from '@/components/community/CommunityView';

// ─── YouTube video map (exercise name → video ID) ────────────────────────────
// Fuzzy-matched via getVideoId() below.
// Every ID here was checked against YouTube's oEmbed API — a dead ID renders a
// grey box and an "unavailable" player, which is what used to break these cards.
const EXERCISE_VIDEOS: Record<string, string> = {
  // Chest / Push
  'Barbell Bench Press':          'SCVCLChPQFY',
  'Bench Press':                  'SCVCLChPQFY',
  'Incline Dumbbell Press':       'DbFgADa2PL8',
  'Chest Press':                  'SCVCLChPQFY',
  'Flyes':                        'eozdVDA78K0',
  'Chest Fly':                    'eozdVDA78K0',
  'Pec Deck':                     'eozdVDA78K0',
  'Push-Up':                      'IODxDxX7oi4',
  'Push Up':                      'IODxDxX7oi4',
  'Push-Ups (or Knee Push-ups)':  'IODxDxX7oi4',
  // Shoulders
  'Overhead Press':               'F3QY5vMz_6I',
  'Dumbbell Shoulder Press':      'F3QY5vMz_6I',
  'Shoulder Press':               'F3QY5vMz_6I',
  'Military Press':               'F3QY5vMz_6I',
  'Arnold Press':                 '6Z15_WdXmVw',
  'Lateral Raises':               'kDqklk1ZESo',
  'Lateral Raise':                'kDqklk1ZESo',
  'Cable Lateral Raise':          'kDqklk1ZESo',
  'Rear Delt Flyes':              'eozdVDA78K0',
  'Rear Delt Fly':                'eozdVDA78K0',
  'Face Pulls':                   'rep-qVOkqgk',
  'Face Pull':                    'rep-qVOkqgk',
  'Upright Row':                  'jaAV-rD45I0',
  'Shrugs':                       'cJRVVxmytaM',
  // Triceps
  'Triceps Dips':                 'sM6XUdt1rm4',
  'Tricep Dips':                  'sM6XUdt1rm4',
  'Dips':                         'sM6XUdt1rm4',
  'Tricep Pushdowns':             'vB5OHsJ3EME',
  'Tricep Pushdown':              'vB5OHsJ3EME',
  'Skullcrushers':                'd_KZxkY_0cM',
  'Arms Supersets':               'ykJmrZ5v0Oo',
  // Back / Pull
  'Pull-Up':                      'eGo4IYlbE5g',
  'Pull Up':                      'eGo4IYlbE5g',
  'Pull-Ups':                     'eGo4IYlbE5g',
  'Pull-Ups (or Rows)':           'eGo4IYlbE5g',
  'Pull-Ups (Weighted if able)':  'eGo4IYlbE5g',
  'Chin-Up':                      'eGo4IYlbE5g',
  'Lat Pulldown':                 'CAwf7n6Luuc',
  'Barbell Rows':                 'vT2GjY_Umpw',
  'Barbell Row':                  'vT2GjY_Umpw',
  'Bent Over Row':                'vT2GjY_Umpw',
  'Rows':                         'vT2GjY_Umpw',
  'Dumbbell Row or Band Pull':    'vT2GjY_Umpw',
  'Cable Row':                    'GZbfZ033f74',
  'Seated Cable Row':             'GZbfZ033f74',
  'T-Bar Row':                    '5foJiIVhs8Q',
  'Chest Supported Row':          '5foJiIVhs8Q',
  'Hanging Leg Raises':           'Pr1ieGZ5atk',
  // Biceps
  'Bicep Curls':                  'ykJmrZ5v0Oo',
  'Bicep Curl':                   'ykJmrZ5v0Oo',
  'Barbell Curls':                'ykJmrZ5v0Oo',
  'Barbell Curl':                 'ykJmrZ5v0Oo',
  'Dumbbell Curl':                'ykJmrZ5v0Oo',
  'Hammer Curls':                 'TwD-YGVP4Bk',
  'Hammer Curl':                  'TwD-YGVP4Bk',
  // Legs
  'Squat':                        'ultWZbUMPL8',
  'Squats':                       'ultWZbUMPL8',
  'Bodyweight Squat':             'ultWZbUMPL8',
  'Bodyweight Squats':            'ultWZbUMPL8',
  'Squats (or Leg Press)':        'ultWZbUMPL8',
  'Back Squat':                   'ultWZbUMPL8',
  'Deadlift':                     'op9kVnSso6Q',
  'Deadlift (or RDL)':            'op9kVnSso6Q',
  'Romanian Deadlift':            'JCXUYuzwNrM',
  'RDL':                          'JCXUYuzwNrM',
  'Leg Press':                    'IZxyjW7MPJQ',
  'Leg Curl':                     'vl5nUdE9mWM',
  'Leg Extension':                'YyvSfVjQeL0',
  'Calf Raises':                  'eMTy3qylqnE',
  'Calf Raise':                   'eMTy3qylqnE',
  'Lunge':                        '3XDriUn0udo',
  'Lunges':                       '3XDriUn0udo',
  'Bulgarian Split Squat':        '2C-uNgKwPLE',
  'Hip Thrust':                   'xDmFkJxPzeM',
  // Core / Abs
  'Plank':                        'kL_NJAkCQBg',
  'Plank / Crunches':             'kL_NJAkCQBg',
  'Crunch':                       'Xyd_fa5zoEU',
  'Crunches':                     'Xyd_fa5zoEU',
  'Ab Rollout':                   'rqiTPdK1c_I',
  'Ab Wheel Rollout':             'rqiTPdK1c_I',
  'Cable Crunch':                 'Xyd_fa5zoEU',
  'Russian Twists':               'wkD8rjkodUI',
  'Russian Twist':                'wkD8rjkodUI',
  // Isometric holds (timed — see the Hold Timer)
  'Planche':                      'pUVpyfjgg5I',
  'Tuck Planche':                 'pUVpyfjgg5I',
  'Planche Lean':                 'pUVpyfjgg5I',
  'Dead Hang':                    'ShkBXOGK7A8',
  'Bar Hang':                     'ShkBXOGK7A8',
  'Passive Hang':                 'ShkBXOGK7A8',
  'L-Sit':                        'HxDP7SqggpI',
  'L Sit':                        'HxDP7SqggpI',
  'Tuck L-Sit':                   'HxDP7SqggpI',
  'Wall Sit':                     'y-wV4Venusw',
  'Hollow Body Hold':             'uZqTUwq96iU',
  'Hollow Hold':                  'uZqTUwq96iU',
  'Side Plank':                   'NXr4Fw8q60o',
  // New PPL / Bro Split exercises
  'Cable Crossover':              'taI4XduLpTk',
  'Flat Dumbbell Fly':            'eozdVDA78K0',
  'Dumbbell Pullover':            '5YStMv6m2g8',
  'Decline Push-Ups':             'IODxDxX7oi4',
  'Straight Arm Pulldown':        'CAwf7n6Luuc',
  'Incline Dumbbell Curl':        'ykJmrZ5v0Oo',
  'Preacher Curl':                'fIWP-FRFNU0',
  'Front Raises':                 '-t7fuZ0KhDA',
  'Dumbbell Row':                 'vT2GjY_Umpw',
  // Warm-up / Cool-down
  'Light Cardio (Brisk Walk/Jog)':'cmple9fw65w',
  'Dynamic Stretches':            'uW3-Ue07H0M',
  'Static Stretching':            'uW3-Ue07H0M',
};

// Fuzzy lookup: matches partial/compound exercise names
const getVideoId = (name: string): string | null => {
  if (!name) return null;
  // Exact match first
  if (EXERCISE_VIDEOS[name]) return EXERCISE_VIDEOS[name];
  const lower = name.toLowerCase();
  // Fuzzy scan — longest key first so "Side Plank" wins over "Plank"
  const keys = Object.keys(EXERCISE_VIDEOS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const k = key.toLowerCase();
    if (lower.includes(k) || k.includes(lower)) return EXERCISE_VIDEOS[key];
  }
  // Keyword fallback — holds first, they're the most specific
  if (lower.includes('planche'))         return 'pUVpyfjgg5I';
  if (lower.includes('dead hang') || lower.includes('bar hang')) return 'ShkBXOGK7A8';
  if (lower.includes('l-sit') || lower.includes('l sit')) return 'HxDP7SqggpI';
  if (lower.includes('wall sit'))        return 'y-wV4Venusw';
  if (lower.includes('hollow'))          return 'uZqTUwq96iU';
  if (lower.includes('bench'))           return 'SCVCLChPQFY';
  if (lower.includes('squat'))           return 'ultWZbUMPL8';
  if (lower.includes('deadlift'))        return 'op9kVnSso6Q';
  if (lower.includes('pull-up') || lower.includes('pullup') || lower.includes('pull up')) return 'eGo4IYlbE5g';
  if (lower.includes('overhead') || lower.includes('press'))   return 'F3QY5vMz_6I';
  if (lower.includes('curl'))            return 'ykJmrZ5v0Oo';
  if (lower.includes('tricep') || lower.includes('dip'))       return 'sM6XUdt1rm4';
  if (lower.includes('lateral'))         return 'kDqklk1ZESo';
  if (lower.includes('lunge'))           return '3XDriUn0udo';
  if (lower.includes('plank'))           return 'kL_NJAkCQBg';
  if (lower.includes('row'))             return 'vT2GjY_Umpw';
  if (lower.includes('calf'))            return 'eMTy3qylqnE';
  if (lower.includes('face pull'))       return 'rep-qVOkqgk';
  if (lower.includes('rdl') || lower.includes('romanian')) return 'JCXUYuzwNrM';
  if (lower.includes('fly') || lower.includes('flye') || lower.includes('crossover')) return 'eozdVDA78K0';
  if (lower.includes('preacher'))        return 'fIWP-FRFNU0';
  if (lower.includes('arnold'))          return '6Z15_WdXmVw';
  if (lower.includes('front raise'))     return '-t7fuZ0KhDA';
  if (lower.includes('shrug'))           return 'cJRVVxmytaM';
  if (lower.includes('hip thrust') || lower.includes('hip thrus')) return 'xDmFkJxPzeM';
  if (lower.includes('pullover'))        return '5YStMv6m2g8';
  if (lower.includes('pulldown') || lower.includes('pull-down')) return 'CAwf7n6Luuc';
  if (lower.includes('extension'))       return 'YyvSfVjQeL0';
  if (lower.includes('russian twist'))   return 'wkD8rjkodUI';
  if (lower.includes('rollout') || lower.includes('ab wheel')) return 'rqiTPdK1c_I';
  if (lower.includes('stretch') || lower.includes('cardio') || lower.includes('warm')) return 'uW3-Ue07H0M';
  return null;
};

// ─── Exercise Database ────────────────────────────────────────────────────────
interface ExerciseEntry {
  name: string;
  category: string;
  muscles: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  sets: string;
  reps: string;
  notes?: string;
  details: { basics: string[]; cues: string };
}

const EXERCISE_DB: ExerciseEntry[] = [
  // ── CHEST ──
  { name: 'Barbell Bench Press', category: 'Chest', muscles: ['Pectorals','Triceps','Front Delts'], difficulty: 'Intermediate', sets: '4', reps: '6-10',
    details: { basics: ['Lie flat on bench, feet flat on floor', 'Grip bar slightly wider than shoulder-width', 'Unrack and lower bar to mid-chest under control', 'Press explosively back to start, lock out elbows'], cues: 'Drive shoulder blades into bench, create a slight arch, bar path is diagonal not straight up' }},
  { name: 'Incline Dumbbell Press', category: 'Chest', muscles: ['Upper Pectorals','Triceps','Front Delts'], difficulty: 'Intermediate', sets: '4', reps: '8-12',
    details: { basics: ['Set bench to 30-45°', 'Start with dumbbells at chest level', 'Press up and slightly inward', 'Lower slowly with control'], cues: 'Keep elbows at 45°, squeeze chest at top, avoid flaring elbows wide' }},
  { name: 'Chest Fly', category: 'Chest', muscles: ['Pectorals'], difficulty: 'Beginner', sets: '3', reps: '12-15',
    details: { basics: ['Lie flat, hold dumbbells above chest', 'Open arms wide with slight elbow bend', 'Feel the stretch across chest', 'Squeeze pecs to return to start'], cues: 'Think "hugging a tree", keep wrists neutral, never go below shoulder level' }},
  { name: 'Push-Up', category: 'Chest', muscles: ['Pectorals','Triceps','Core'], difficulty: 'Beginner', sets: '3', reps: '15-20',
    details: { basics: ['Place hands shoulder-width apart', 'Keep body in straight line from head to heels', 'Lower chest to floor', 'Push back up fully'], cues: 'Squeeze glutes and core throughout, elbows 45° not flared, full range of motion' }},
  { name: 'Cable Crossover', category: 'Chest', muscles: ['Pectorals'], difficulty: 'Intermediate', sets: '3', reps: '12-15',
    details: { basics: ['Stand between cables set high', 'Step forward slightly, lean into it', 'Bring hands together in front of chest', 'Control the return'], cues: 'Think about closing your arms like a hug, rotate hands inward at peak contraction' }},
  { name: 'Dips', category: 'Chest', muscles: ['Pectorals','Triceps','Front Delts'], difficulty: 'Intermediate', sets: '3', reps: '8-12',
    details: { basics: ['Grip parallel bars, arms extended', 'Lean forward slightly for chest focus', 'Lower until upper arms are parallel', 'Press back up'], cues: 'Lean forward to shift load to chest, cross feet to stabilise, squeeze at top' }},

  // ── BACK ──
  { name: 'Pull-Up', category: 'Back', muscles: ['Latissimus Dorsi','Biceps','Rear Delts'], difficulty: 'Intermediate', sets: '4', reps: '6-10',
    details: { basics: ['Hang from bar with overhand grip', 'Retract scapula, then pull elbows down', 'Chin clears the bar', 'Lower with full control'], cues: 'Start every rep from dead hang, drive elbows to hips, avoid swinging' }},
  { name: 'Lat Pulldown', category: 'Back', muscles: ['Latissimus Dorsi','Biceps'], difficulty: 'Beginner', sets: '4', reps: '10-12',
    details: { basics: ['Grip bar slightly wider than shoulders', 'Lean back 15-20°, chest proud', 'Pull bar to upper chest', 'Squeeze lats and control return'], cues: 'Think "elbows to back pockets", avoid shrugging shoulders, keep chest up' }},
  { name: 'Barbell Row', category: 'Back', muscles: ['Latissimus Dorsi','Rhomboids','Biceps'], difficulty: 'Intermediate', sets: '4', reps: '6-10',
    details: { basics: ['Hip hinge to ~45°, bar hanging', 'Pull bar to lower sternum', 'Retract shoulder blades at top', 'Lower with control'], cues: 'Keep back flat (no rounding), lead with elbows, keep bar close to body' }},
  { name: 'Seated Cable Row', category: 'Back', muscles: ['Rhomboids','Latissimus Dorsi','Biceps'], difficulty: 'Beginner', sets: '3', reps: '10-12',
    details: { basics: ['Sit upright, feet on platform', 'Pull handle to lower sternum', 'Squeeze shoulder blades together', 'Return with arms fully extended'], cues: 'Row with elbows close, avoid leaning back, full stretch at the front' }},
  { name: 'Deadlift', category: 'Back', muscles: ['Hamstrings','Glutes','Erectors','Lats'], difficulty: 'Advanced', sets: '4', reps: '4-6',
    details: { basics: ['Feet hip-width, bar over mid-foot', 'Hip hinge, grip just outside legs', 'Chest tall, back flat, brace core', 'Drive floor away, lock hips at top'], cues: 'Bar stays in contact with shins/thighs, push floor not pull bar, squeeze glutes at lockout' }},
  { name: 'T-Bar Row', category: 'Back', muscles: ['Latissimus Dorsi','Rhomboids'], difficulty: 'Intermediate', sets: '4', reps: '8-10',
    details: { basics: ['Straddle the bar, hip hinge forward', 'Grip neutral handles', 'Pull to lower chest', 'Squeeze and control descent'], cues: 'Chest on pad helps keep back flat, retract scapula, elbows track back' }},

  // ── LEGS ──
  { name: 'Back Squat', category: 'Legs', muscles: ['Quadriceps','Glutes','Hamstrings'], difficulty: 'Intermediate', sets: '4', reps: '6-10',
    details: { basics: ['Bar on traps, feet shoulder-width', 'Break at hips and knees simultaneously', 'Thighs reach parallel or below', 'Drive through heels to stand'], cues: 'Knees track toes, chest stays up, brace core like taking a punch, sit back and down' }},
  { name: 'Romanian Deadlift', category: 'Legs', muscles: ['Hamstrings','Glutes'], difficulty: 'Intermediate', sets: '3', reps: '10-12',
    details: { basics: ['Hold bar at hip level, slight knee bend', 'Hinge at hips, push them back', 'Bar slides down thighs until stretch', 'Drive hips forward to return'], cues: 'Feel hamstring stretch not lower-back pain, keep bar close to body, soft knee bend throughout' }},
  { name: 'Leg Press', category: 'Legs', muscles: ['Quadriceps','Glutes'], difficulty: 'Beginner', sets: '4', reps: '10-15',
    details: { basics: ['Feet shoulder-width on platform', 'Lower platform until 90° knee angle', 'Press through full foot', 'Do not lock out knees completely'], cues: 'High foot placement targets glutes, low placement targets quads, never let back lift off pad' }},
  { name: 'Leg Curl', category: 'Legs', muscles: ['Hamstrings'], difficulty: 'Beginner', sets: '3', reps: '12-15',
    details: { basics: ['Lie face down, pad above heels', 'Curl heels toward glutes', 'Squeeze at top for 1 second', 'Lower slowly'], cues: 'Keep hips pinned to pad, pause at peak, 3-second eccentric for more growth' }},
  { name: 'Hip Thrust', category: 'Legs', muscles: ['Glutes'], difficulty: 'Beginner', sets: '4', reps: '10-15',
    details: { basics: ['Upper back on bench, bar on hips', 'Feet flat, shoulder-width apart', 'Drive hips up until body is parallel', 'Squeeze glutes hard at top'], cues: 'Chin tucked, ribcage down, think "show ceiling your belt buckle", pause at top' }},
  { name: 'Bulgarian Split Squat', category: 'Legs', muscles: ['Quadriceps','Glutes'], difficulty: 'Advanced', sets: '3', reps: '8-10 each',
    details: { basics: ['Rear foot elevated on bench', 'Front foot far enough forward', 'Lower back knee toward floor', 'Drive through front heel to rise'], cues: 'Front shin vertical at bottom, torso slight forward lean, keep weight on front heel' }},
  { name: 'Calf Raises', category: 'Legs', muscles: ['Gastrocnemius','Soleus'], difficulty: 'Beginner', sets: '4', reps: '15-20',
    details: { basics: ['Stand on edge of platform', 'Lower heels below level', 'Rise up on toes as high as possible', 'Pause at top, slow descent'], cues: 'Full range of motion is everything, slow eccentric, pause at bottom to kill the bounce' }},

  // ── SHOULDERS ──
  { name: 'Overhead Press', category: 'Shoulders', muscles: ['Front Delts','Lateral Delts','Triceps'], difficulty: 'Intermediate', sets: '4', reps: '6-10',
    details: { basics: ['Bar at shoulder height, narrow grip', 'Brace core, slightly lean back', 'Press overhead until arms lock out', 'Lower to clavicle'], cues: 'Push head through at lockout, keep elbows forward, do not arch lower back excessively' }},
  { name: 'Arnold Press', category: 'Shoulders', muscles: ['Front Delts','Lateral Delts','Rear Delts'], difficulty: 'Intermediate', sets: '3', reps: '10-12',
    details: { basics: ['Start with palms facing you at chin', 'Rotate palms outward as you press up', 'Fully extend overhead', 'Reverse on the way down'], cues: 'Slow rotation hits all three delt heads, control the full range, no momentum' }},
  { name: 'Lateral Raise', category: 'Shoulders', muscles: ['Lateral Delts'], difficulty: 'Beginner', sets: '4', reps: '12-15',
    details: { basics: ['Hold dumbbells at sides', 'Raise arms out to sides to shoulder height', 'Lead with elbows, not hands', 'Lower slowly'], cues: 'Slight forward lean, pinky slightly higher than thumb, 4-second negative for maximum burn' }},
  { name: 'Face Pull', category: 'Shoulders', muscles: ['Rear Delts','Rotator Cuff'], difficulty: 'Beginner', sets: '3', reps: '15-20',
    details: { basics: ['Set cable to upper-chest height', 'Grip rope with both hands', 'Pull toward face, elbows high and wide', 'Externally rotate at end'], cues: 'Elbows must stay above wrists, pull apart the rope at the end, great for shoulder health' }},
  { name: 'Rear Delt Fly', category: 'Shoulders', muscles: ['Rear Delts','Rhomboids'], difficulty: 'Beginner', sets: '3', reps: '15',
    details: { basics: ['Hinge forward 45°, dumbbells hanging', 'Raise arms out to sides', 'Pinch shoulder blades at top', 'Lower with control'], cues: 'Keep soft elbow bend, lead with elbows, avoid using momentum, squeeze rear delts' }},

  // ── ARMS ──
  { name: 'Barbell Curl', category: 'Arms', muscles: ['Biceps'], difficulty: 'Beginner', sets: '4', reps: '8-12',
    details: { basics: ['Grip bar shoulder-width, supinated', 'Keep elbows pinned to sides', 'Curl bar toward chin', 'Lower fully and slowly'], cues: 'No swinging, full extension at bottom, squeeze at top, wrists stay neutral' }},
  { name: 'Hammer Curl', category: 'Arms', muscles: ['Biceps','Brachialis'], difficulty: 'Beginner', sets: '3', reps: '10-12',
    details: { basics: ['Hold dumbbells with neutral grip', 'Keep elbows at sides', 'Curl up keeping thumbs pointing up', 'Lower with control'], cues: 'Hits brachialis under bicep making arms look thicker, keep wrist straight throughout' }},
  { name: 'Preacher Curl', category: 'Arms', muscles: ['Biceps'], difficulty: 'Intermediate', sets: '3', reps: '10-12',
    details: { basics: ['Chest on preacher pad, arms over pad', 'Full extension at bottom', 'Curl to chin height', 'Squeeze and lower slowly'], cues: 'Complete stretch at bottom is key, do not cheat with shoulder, go heavier than you think' }},
  { name: 'Tricep Pushdown', category: 'Arms', muscles: ['Triceps'], difficulty: 'Beginner', sets: '4', reps: '12-15',
    details: { basics: ['Stand at cable, rope or bar attachment', 'Elbows pinned to sides', 'Push down until arms extend fully', 'Return slowly to 90°'], cues: 'Elbows must not flare, squeeze triceps hard at lockout, lean slightly forward' }},
  { name: 'Skullcrusher', category: 'Arms', muscles: ['Triceps'], difficulty: 'Intermediate', sets: '4', reps: '10-12',
    details: { basics: ['Lie on bench, bar over chest arms straight', 'Keep elbows pointing up, lower bar to forehead', 'Extend back to start'], cues: 'Elbows stay perpendicular to floor, use moderate weight to protect elbows, slow on the way down' }},

  // ── CORE ──
  { name: 'Hanging Leg Raise', category: 'Core', muscles: ['Lower Abs','Hip Flexors'], difficulty: 'Intermediate', sets: '3', reps: '10-15',
    details: { basics: ['Hang from bar, arms fully extended', 'Tuck pelvis and raise knees to chest', 'Controlled lower, no swinging'], cues: 'Tuck pelvis first to activate abs not just hip flexors, squeeze abs at top, slow and controlled' }},
  { name: 'Ab Rollout', category: 'Core', muscles: ['Rectus Abdominis','Obliques'], difficulty: 'Advanced', sets: '3', reps: '8-12',
    details: { basics: ['Kneel, hands on ab wheel', 'Roll forward slowly keeping back flat', 'Extend as far as you can control', 'Pull back with abs'], cues: 'No lower back sagging, exhale on return, brace hard before every rep' }},
  { name: 'Russian Twist', category: 'Core', muscles: ['Obliques'], difficulty: 'Beginner', sets: '3', reps: '20 total',
    details: { basics: ['Sit at 45°, feet raised or grounded', 'Hold weight or hands clasped', 'Rotate side to side'], cues: 'Rotate from torso not just arms, keep chest up, slow down for more burn' }},
  { name: 'Crunches', category: 'Core', muscles: ['Rectus Abdominis'], difficulty: 'Beginner', sets: '3', reps: '15-20',
    details: { basics: ['Lie on back, knees bent', 'Hands behind head, elbows wide', 'Curl shoulders off floor toward knees', 'Lower slowly'], cues: 'Only partial range needed, exhale hard on the way up, do not pull neck, squeeze abs at top' }},

  // ── HOLDS (timed isometrics — use the Hold Timer) ──
  { name: 'Planche', category: 'Holds', muscles: ['Front Delts','Chest','Core','Biceps'], difficulty: 'Advanced', sets: '4', reps: '10-20 sec',
    details: { basics: ['Start from a planche lean on parallettes or floor', 'Hands turned slightly out, elbows locked', 'Lean forward until feet lift, hips level with shoulders', 'Protract shoulders hard and hold the line'], cues: 'Progress tuck → advanced tuck → straddle. Lean is everything — depress and protract the scapula, squeeze glutes so the hips do not sag' }},
  { name: 'Dead Hang', category: 'Holds', muscles: ['Forearms','Lats','Shoulders'], difficulty: 'Beginner', sets: '3', reps: '30-60 sec',
    details: { basics: ['Grip the bar shoulder-width, overhand', 'Let the body hang fully, arms straight', 'Relax the shoulders into the passive hang, breathe', 'Step down under control'], cues: 'Build to 60s for grip and shoulder health. Add an active hang (shoulders pulled down) once passive hangs feel easy' }},
  { name: 'L-Sit', category: 'Holds', muscles: ['Lower Abs','Hip Flexors','Triceps','Quads'], difficulty: 'Advanced', sets: '4', reps: '10-30 sec',
    details: { basics: ['Sit between parallettes or on the floor, hands flat', 'Push the floor away, depress the shoulders', 'Lift the hips, then extend legs to horizontal', 'Hold with toes pointed'], cues: 'Start tucked, then one leg, then full L. Push down hard through straight arms — most people fail from the shoulders, not the abs' }},
  { name: 'Wall Sit', category: 'Holds', muscles: ['Quadriceps','Glutes'], difficulty: 'Beginner', sets: '3', reps: '30-60 sec',
    details: { basics: ['Back flat against a wall, feet a step forward', 'Slide down until knees are at 90°', 'Keep weight in the heels', 'Hold, then stand up under control'], cues: 'Thighs parallel to the floor, knees over ankles not toes, breathe steadily instead of bracing your breath' }},
  { name: 'Plank', category: 'Holds', muscles: ['Transverse Abdominis','Obliques','Erectors'], difficulty: 'Beginner', sets: '3', reps: '30-60 sec',
    details: { basics: ['Elbows under shoulders, forearms flat', 'Body in a straight line head to heel', 'Squeeze glutes and quads', 'Breathe normally and hold'], cues: 'Quality beats duration — if the hips sag or rise, the set is over. Pull elbows toward toes to raise the tension' }},
  { name: 'Side Plank', category: 'Holds', muscles: ['Obliques','Glute Medius'], difficulty: 'Beginner', sets: '3', reps: '30 sec each',
    details: { basics: ['Lie on one side, elbow under shoulder', 'Stack feet, lift the hips off the floor', 'Body straight from head to heels', 'Hold, then swap sides'], cues: 'Push the bottom shoulder away from the floor, keep the top hip stacked, do not let the chest rotate down' }},
  { name: 'Hollow Body Hold', category: 'Holds', muscles: ['Rectus Abdominis','Hip Flexors'], difficulty: 'Intermediate', sets: '3', reps: '20-45 sec',
    details: { basics: ['Lie on your back, press the lower back into the floor', 'Lift shoulders and legs off the ground', 'Arms overhead, body in a shallow banana shape', 'Hold without letting the back arch'], cues: 'Lower back stays glued to the floor — if it lifts, tuck the knees in. This is the base position for every advanced calisthenics skill' }},
  { name: 'Chin-Up Hold', category: 'Holds', muscles: ['Biceps','Lats','Forearms'], difficulty: 'Intermediate', sets: '3', reps: '15-30 sec',
    details: { basics: ['Jump or pull to the top of a chin-up', 'Chin above the bar, chest to the bar', 'Hold the position, elbows pinned', 'Lower slowly rather than dropping'], cues: 'Great for building the top-end strength most people lack. Squeeze the bar and keep the shoulders down and back' }},
];

// ─── YouTube search ───────────────────────────────────────────────────────────
// Goes through our Worker so the API key stays server-side. If no key is
// configured the Worker says so and we fall back to filtering the curated list.
const YT_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

interface YTVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

class SearchUnavailable extends Error {}

async function searchYouTube(query: string, maxResults = 12): Promise<YTVideo[]> {
  const toVideos = (items: any[]): YTVideo[] =>
    (items || [])
      .filter((item: any) => item?.id?.videoId)
      .map((item: any) => ({
        id:        item.id.videoId,
        title:     item.snippet?.title || 'Untitled',
        channel:   item.snippet?.channelTitle || '',
        thumbnail: item.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
      }));

  // Preferred path: the Worker proxy (key never reaches the browser)
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/youtube/search?q=${encodeURIComponent(query)}&max=${maxResults}`,
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.unavailable) throw new SearchUnavailable(data.message || 'Live search is not configured');
      return toVideos(data.items);
    }
  } catch (err) {
    if (err instanceof SearchUnavailable && !YT_KEY) throw err;
  }

  // Legacy path: a browser-side key, if one was configured at build time
  if (!YT_KEY) throw new SearchUnavailable('Live search is not configured');
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YT_KEY}&part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&order=relevance`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('YouTube search failed');
  const data = await res.json();
  return toVideos(data.items);
}

// ─── Motivation Videos ────────────────────────────────────────────────────────
// Every ID below was resolved through YouTube's oEmbed API, so the title and
// channel here are the real ones. The old list had IDs that pointed at music
// videos and a rickroll — that's what made this page look broken.
const MOTIVATION_VIDEOS = [
  // Mindset
  { id: 'jnIOLO6dpj0', title: 'BE BETTER — David Goggins Motivational Speech',        channel: 'Allaroundus',      tag: 'Mindset'   },
  { id: 'X4nGU4DZUwE', title: 'You Owe It To You — David Goggins',                    channel: 'Motiversity',      tag: 'Mindset'   },
  { id: 'IdTMDpizis8', title: 'Jocko Willink — "GOOD"',                               channel: 'Jocko Podcast',    tag: 'Mindset'   },
  { id: 'jHnX-nMl59U', title: 'No Excuses, Get It Done — Jocko Willink',              channel: 'Motiversity',      tag: 'Mindset'   },
  { id: 'lsSC2vx7zFQ', title: 'How Bad Do You Want It? — Eric Thomas',                channel: 'Matt Howell',      tag: 'Mindset'   },
  { id: 'pxBQLFLei70', title: 'Make Your Bed — Admiral McRaven',                      channel: 'Texas Exes',       tag: 'Mindset'   },
  // Legends
  { id: '1bumPyvzCyo', title: 'Arnold Schwarzenegger Leaves the Audience Speechless', channel: 'MotivationHub',    tag: 'Legend'    },
  { id: 'h0ABOGyELN0', title: 'Unleash Your Inner Beast — Arnold Gym Motivation',     channel: 'MulliganBrothers', tag: 'Legend'    },
  { id: 'sowNUzd8cFc', title: 'Born On The Wrong Planet — Ronnie Coleman',            channel: 'Raiden Motivation',tag: 'Legend'    },
  { id: 'GMEMKMAb5w4', title: 'Ronnie Coleman — The King. Yeah Buddy',                channel: 'Orges7 Motivation',tag: 'Legend'    },
  { id: 'Xtvqhyo5c74', title: 'Becoming the G.O.A.T — Ronnie Coleman Story',          channel: 'Nicandro Vision',  tag: 'Legend'    },
  // Physique
  { id: '_x1i1hTFme0', title: 'Chris Bumstead — Olympia Champion Mentality',          channel: 'Chris Bumstead',   tag: 'Physique'  },
  { id: 'Ly7qDdFB494', title: 'Chris Bumstead — 3× Mr. Olympia Motivation',           channel: 'Motivathlete',     tag: 'Physique'  },
  { id: 's5JWUu-BcPY', title: 'More Than Muscles — Bodybuilding Lifestyle',           channel: 'Makaveli Motivation', tag: 'Physique' },
  // Education
  { id: 'lu_BObG6dj8', title: 'How To Build Muscle (Explained In 5 Levels)',          channel: 'Jeff Nippard',     tag: 'Education' },
  { id: '71op1DQ2gyo', title: 'How To Train For Pure Muscle Growth',                  channel: 'Jeff Nippard',     tag: 'Education' },
  { id: 'Pok0Jg2JAkE', title: 'The Smartest Way To Use Protein To Build Muscle',      channel: 'Jeff Nippard',     tag: 'Education' },
  { id: 'eMjyvIQbn9M', title: 'The Best Science-Based Minimalist Workout Plan',       channel: 'Jeff Nippard',     tag: 'Education' },
  { id: 'KKBZeZszOOM', title: 'How to Train LESS and Get Far Better Results',         channel: 'ATHLEAN-X',        tag: 'Education' },
  // Technique
  { id: 'Uv_DKDl7EjA', title: 'The Official Squat Form Checklist',                    channel: 'Squat University', tag: 'Technique' },
  { id: 'vmNPOjaGrVE', title: 'How To Squat: Low Bar',                                channel: 'Alan Thrall',      tag: 'Technique' },
  { id: 'hCDzSR6bW10', title: 'The Official Deadlift Checklist',                      channel: 'ATHLEAN-X',        tag: 'Technique' },
  { id: 'vcBig73ojpE', title: 'How To Get A Huge Bench Press with Perfect Technique', channel: 'Jeff Nippard',     tag: 'Technique' },
  { id: 'yN6Q1UI_xkE', title: 'How To Do Dips For A Bigger Chest and Shoulders',      channel: 'Jeff Nippard',     tag: 'Technique' },
  // Calisthenics / holds
  { id: 'pUVpyfjgg5I', title: 'From Zero to Tuck Planche — Progressions',             channel: 'Vitality',         tag: 'Holds'     },
  { id: 'HxDP7SqggpI', title: 'From Zero to L-Sit in 8 Steps',                        channel: 'Vitality',         tag: 'Holds'     },
  { id: 'ShkBXOGK7A8', title: 'How Hanging Transforms Your Body (Dead Hangs)',        channel: 'FitnessFAQs',      tag: 'Holds'     },
  { id: 'uZqTUwq96iU', title: 'The Best Hollow Body Progressions',                    channel: 'FitnessFAQs',      tag: 'Holds'     },
  { id: 'kL_NJAkCQBg', title: 'Mastering the Plank — In Just 2 Minutes',              channel: 'Calisthenic Movement', tag: 'Holds' },
  // India
  { id: 'Dyj-DCQBz3Q', title: 'Breakup Makes Bodybuilders — Unstoppable Gym Motivation', channel: 'Yash Anand',    tag: 'India'     },
  { id: 'JG9Ii3MyOzw', title: 'Tum Nahi Samjhoge — The True Spirit Of Fitness',       channel: 'MuscleBlaze',      tag: 'India'     },
  { id: '_L6RLrO7HrY', title: 'The Beast Nitin Chandila — Bodybuilding Motivation',   channel: 'Mind Vision',      tag: 'India'     },
  { id: 'ULxHDbwzJZM', title: 'Bolo Har Har — Bodybuilding Motivation (Hindi)',       channel: 'Real Vision',      tag: 'India'     },
];

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
const EditProfileModal = ({ userProfile, userId, onClose, onSaved }: any) => {
  const p = userProfile?.profile     || {};
  const g = userProfile?.goal        || {};
  const r = userProfile?.preferences || {};

  const [tab, setTab] = useState<'profile' | 'goals' | 'prefs'>('profile');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const [profile, setProfile] = useState({
    age:                p.age               || '',
    gender:             p.gender            || 'Male',
    height:             p.height            || '',
    currentWeight:      p.current_weight    || p.currentWeight    || '',
    bodyFatPercentage:  p.body_fat_percentage || p.bodyFatPercentage || '',
    experienceLevel:    p.experience_level  || p.experienceLevel  || 'Beginner',
  });

  const [goal, setGoal] = useState({
    primaryGoal:  g.primary_goal  || g.primaryGoal  || 'Athletic Physique',
    targetWeight: g.target_weight || g.targetWeight || '',
    timeframe:    g.timeframe     || '',
    injuries:     g.injuries      || 'None',
  });

  const [prefs, setPrefs] = useState({
    environment:      r.environment       || 'Gym',
    daysPerWeek:      r.days_per_week     || r.daysPerWeek     || 4,
    split:            r.split             || 'Push/Pull/Legs',
    trainingTime:     r.training_time     || r.trainingTime    || 'Morning',
    cardioPreference: r.cardio_preference || r.cardioPreference|| 'None',
    dietType:         r.diet_type         || r.dietType        || 'Non-Veg',
    cuisine:          r.cuisine           || 'International',
    budget:           r.budget            || 'Budget',
  });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await Promise.all([
        axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/profile`, {
          userId,
          age: Number(profile.age),
          gender: profile.gender,
          height: Number(profile.height),
          currentWeight: Number(profile.currentWeight),
          bodyFatPercentage: Number(profile.bodyFatPercentage) || 0,
          experienceLevel: profile.experienceLevel,
        }),
        axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/goal`, {
          userId,
          primaryGoal: goal.primaryGoal,
          targetWeight: Number(goal.targetWeight) || 0,
          timeframe: goal.timeframe,
          injuries: goal.injuries,
        }),
        axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/preferences`, {
          userId,
          environment: prefs.environment,
          daysPerWeek: Number(prefs.daysPerWeek),
          split: prefs.split,
          trainingTime: prefs.trainingTime,
          cardioPreference: prefs.cardioPreference,
          dietType: prefs.dietType,
          cuisine: prefs.cuisine,
          budget: prefs.budget,
        }),
      ]);
      // Regenerate plans with updated data
      await Promise.all([
        axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/workout/generate`, { userId }),
        axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/diet/generate`,    { userId }),
      ]);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition";
  const selectCls = inputCls;
  const labelCls  = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide";

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'goals',   label: 'Goals'   },
    { id: 'prefs',   label: 'Preferences' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-800 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit My Data</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Plans will regenerate after saving</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* ── PROFILE TAB ── */}
          {tab === 'profile' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Age</label>
                  <input type="number" className={inputCls} value={profile.age}
                    onChange={e => setProfile(p => ({ ...p, age: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select className={selectCls} value={profile.gender}
                    onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Height (cm)</label>
                  <input type="number" className={inputCls} value={profile.height}
                    onChange={e => setProfile(p => ({ ...p, height: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Weight (kg)</label>
                  <input type="number" className={inputCls} value={profile.currentWeight}
                    onChange={e => setProfile(p => ({ ...p, currentWeight: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Body Fat %</label>
                  <input type="number" className={inputCls} value={profile.bodyFatPercentage}
                    onChange={e => setProfile(p => ({ ...p, bodyFatPercentage: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Experience Level</label>
                  <select className={selectCls} value={profile.experienceLevel}
                    onChange={e => setProfile(p => ({ ...p, experienceLevel: e.target.value }))}>
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ── GOALS TAB ── */}
          {tab === 'goals' && (
            <>
              <div>
                <label className={labelCls}>Primary Goal</label>
                <select className={selectCls} value={goal.primaryGoal}
                  onChange={e => setGoal(g => ({ ...g, primaryGoal: e.target.value }))}>
                  <option>Weight Gain</option>
                  <option>Bodybuilding</option>
                  <option>Cutting</option>
                  <option>Athletic Physique</option>
                  <option>Fat Loss</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Target Weight (kg)</label>
                  <input type="number" className={inputCls} value={goal.targetWeight}
                    onChange={e => setGoal(g => ({ ...g, targetWeight: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Timeframe</label>
                  <input type="text" placeholder="e.g. 3 months" className={inputCls} value={goal.timeframe}
                    onChange={e => setGoal(g => ({ ...g, timeframe: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Injuries / Notes</label>
                <input type="text" placeholder="e.g. Knee pain, or None" className={inputCls} value={goal.injuries}
                  onChange={e => setGoal(g => ({ ...g, injuries: e.target.value }))} />
              </div>
            </>
          )}

          {/* ── PREFERENCES TAB ── */}
          {tab === 'prefs' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Environment</label>
                  <select className={selectCls} value={prefs.environment}
                    onChange={e => setPrefs(p => ({ ...p, environment: e.target.value }))}>
                    <option>Gym</option><option>Home</option><option>Both</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Days / Week</label>
                  <select className={selectCls} value={prefs.daysPerWeek}
                    onChange={e => setPrefs(p => ({ ...p, daysPerWeek: Number(e.target.value) }))}>
                    {[3,4,5,6,7].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Split</label>
                  <select className={selectCls} value={prefs.split}
                    onChange={e => setPrefs(p => ({ ...p, split: e.target.value }))}>
                    <option>Push/Pull/Legs</option>
                    <option>Bro Split</option>
                    <option>Upper/Lower</option>
                    <option>Full Body</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Training Time</label>
                  <select className={selectCls} value={prefs.trainingTime}
                    onChange={e => setPrefs(p => ({ ...p, trainingTime: e.target.value }))}>
                    <option>Morning</option><option>Evening</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Cardio</label>
                  <select className={selectCls} value={prefs.cardioPreference}
                    onChange={e => setPrefs(p => ({ ...p, cardioPreference: e.target.value }))}>
                    <option>None</option><option>HIIT</option><option>LISS</option><option>Sports</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Cuisine</label>
                  <select className={selectCls} value={prefs.cuisine}
                    onChange={e => setPrefs(p => ({ ...p, cuisine: e.target.value }))}>
                    <option>Indian</option><option>International</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Budget</label>
                  <select className={selectCls} value={prefs.budget}
                    onChange={e => setPrefs(p => ({ ...p, budget: e.target.value }))}>
                    <option>Budget</option><option>Premium</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition text-sm">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save & Regenerate</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Global Styles & Animations ---
const GlobalStyles = () => (
  <style>{`
    /* ── Line chart draw ── */
    @keyframes drawLine {
      from { stroke-dashoffset: 2000; }
      to   { stroke-dashoffset: 0; }
    }
    .animate-draw {
      stroke-dasharray: 2000;
      animation: drawLine 2s ease-out forwards;
    }

    /* ── Fade + scale in ── */
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-enter {
      animation: fadeInScale 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* ── Slide up ── */
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up {
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* ── Pop in ── */
    @keyframes popIn {
      0%   { opacity: 0; transform: scale(0.8); }
      70%  { transform: scale(1.05); }
      100% { opacity: 1; transform: scale(1); }
    }
    .animate-pop-in {
      animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    /* ── Aurora background ── */
    @keyframes aurora {
      0%   { transform: translate(0, 0) scale(1); }
      33%  { transform: translate(60px, -40px) scale(1.15); }
      66%  { transform: translate(-40px, 30px) scale(0.9); }
      100% { transform: translate(0, 0) scale(1); }
    }
    .animate-aurora {
      animation: aurora 14s ease-in-out infinite;
    }
    .animate-aurora-slow {
      animation: aurora 20s ease-in-out infinite reverse;
    }
    .animate-aurora-med {
      animation: aurora 17s ease-in-out infinite 3s;
    }

    /* ── Neon border pulse ── */
    @keyframes neon-border {
      0%, 100% { box-shadow: 0 0 0 1px rgba(99,102,241,0.15), 0 0 20px rgba(99,102,241,0); }
      50%       { box-shadow: 0 0 0 1px rgba(99,102,241,0.4),  0 0 24px rgba(99,102,241,0.15); }
    }
    .dark .neon-card:hover {
      animation: neon-border 2s ease-in-out infinite;
      border-color: rgba(99,102,241,0.4) !important;
    }

    /* ── Floating orb ── */
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50%       { transform: translateY(-18px) rotate(5deg); }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-float-delayed { animation: float 8s ease-in-out infinite 2s; }

    /* ── Shimmer scan ── */
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }
    .animate-shimmer {
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
      background-size: 200% 100%;
      animation: shimmer 2.5s linear infinite;
    }

    /* ── Glow pulse (icon backgrounds) ── */
    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
      50%       { box-shadow: 0 0 12px 4px rgba(99,102,241,0.25); }
    }
    .animate-glow { animation: glow-pulse 2.4s ease-in-out infinite; }

    /* ── Gradient text shimmer ── */
    @keyframes text-shimmer {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .animate-text-gradient {
      background: linear-gradient(270deg, #818cf8, #c084fc, #38bdf8, #818cf8);
      background-size: 300% 300%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: text-shimmer 6s ease infinite;
    }

    /* ── Scrollbar ── */
    .scrollbar-hide::-webkit-scrollbar { display: none; }

    /* ── Glass panels ── */
    .glass-panel {
      background: rgba(255,255,255,0.72);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
    }
    .dark .glass-panel {
      background: rgba(6, 8, 20, 0.75);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
    }

    /* ── Dark card ── */
    .dark .dark-card {
      background: linear-gradient(145deg, rgba(17,24,39,0.9), rgba(10,14,26,0.95));
      border-color: rgba(55,65,90,0.6);
    }
    .dark .dark-card:hover {
      border-color: rgba(99,102,241,0.35);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.15);
    }

    /* ── Hover lift ── */
    .hover-lift {
      transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s ease;
    }
    .hover-lift:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 32px rgba(0,0,0,0.12);
    }
    .dark .hover-lift:hover {
      box-shadow: 0 14px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,102,241,0.2);
    }
    .hover-lift:active {
      transform: translateY(-1px) scale(0.99);
    }

    /* ── Sidebar neon active ── */
    .dark .nav-active-glow {
      box-shadow: inset 3px 0 0 #818cf8, 0 0 20px rgba(129,140,248,0.08);
    }
  `}</style>
);

// --- Helper Components ---

// 1. Animated Counter for Metrics
const CountUp = ({ end, suffix = "", duration = 1000 }: any) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: any;
    const animate = (time: any) => {
      if (!startTime) startTime = time;
      const progress = time - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - percentage, 4);
      
      setCount(Math.min(end * easeOutQuart, end));

      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count.toFixed(1)}{suffix}</span>;
};

// 2. Reusable Card Component with Hover Lift
const Card = ({ children, className = "", delay = 0 }: any) => (
  <div
    className={`dark-card bg-white dark:bg-[#0d1117] rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800/60 overflow-hidden animate-enter transition-[transform,box-shadow,border-color] duration-300 hover:shadow-xl dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1 ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

// 3. Custom SVG Line Chart
const SmoothLineChart = ({ data, color = "#6366f1", isDarkMode }: any) => {
  const height = 200;
  const width = 600;
  const padding = 20;
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">No Data Yet</div>;

  // Normalize data
  const minVal = Math.min(...data.map((d:any) => d.value));
  const maxVal = Math.max(...data.map((d:any) => d.value));
  const range = maxVal - minVal || 1;
  
  const getXY = (value: number, index: number) => {
    // Safely handle data.length <= 1 to avoid division by zero
    const xRatio = data.length > 1 ? index / (data.length - 1) : 0.5;
    const x = padding + xRatio * (width - padding * 2);
    
    // Safely handle range being 0 if all values are the same (maxVal - minVal = 0)
    const yRatio = range === 0 ? 0.5 : (value - minVal) / range;
    const y = height - padding - yRatio * (height - padding * 2);
    
    return { x, y };
  };

  const pointsString = data.map((d: any, i: number) => {
    const { x, y } = getXY(d.value, i);
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `${pointsString} L ${width - padding},${height} L ${padding},${height} Z`;
  const gridColor = isDarkMode ? "#334155" : "#f1f5f9";

  return (
    <div className="w-full h-full relative overflow-visible group">
      {hoveredPoint && (
        <div 
          className="absolute z-10 bg-slate-900 text-white text-xs py-1 px-2 rounded-lg pointer-events-none transform -translate-x-1/2 -translate-y-12 transition-all duration-75 shadow-lg"
          style={{ left: hoveredPoint.x, top: hoveredPoint.y }}
        >
          <div className="font-bold">{hoveredPoint.value}kg</div>
          <div className="text-slate-400 text-[10px]">{hoveredPoint.label}</div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
          <line 
            key={i}
            x1={padding} 
            y1={height - padding - (tick * (height - padding * 2))} 
            x2={width - padding} 
            y2={height - padding - (tick * (height - padding * 2))} 
            stroke={gridColor} 
            strokeWidth="1" 
          />
        ))}

        <path d={`M ${pointsString.split(' ')[0]} L ${areaPath}`} fill={`url(#gradient-${color})`} stroke="none" className="opacity-0 animate-enter" style={{ animationDelay: '0.5s' }} />
        
        <polyline 
          points={pointsString} 
          fill="none" 
          stroke={color} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="animate-draw"
        />

        {data.map((d: any, i: number) => {
           const { x, y } = getXY(d.value, i);
           return (
             <g key={i} onMouseEnter={() => setHoveredPoint({ x, y, value: d.value, label: d.label })} onMouseLeave={() => setHoveredPoint(null)}>
                <circle cx={x} cy={y} r="12" fill="transparent" className="cursor-pointer" />
                <circle 
                  cx={x} 
                  cy={y} 
                  r={hoveredPoint?.label === d.label ? 6 : 4} 
                  fill={isDarkMode ? "#1e293b" : "white"} 
                  stroke={color} 
                  strokeWidth="2"
                  className="transition-all duration-300 pointer-events-none"
                />
             </g>
           );
        })}
      </svg>
    </div>
  );
};

// 4. Animated Circular Progress
const CircularProgress = ({ value, max, color, icon: Icon, label, subLabel, isDarkMode, delay = 0 }: any) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const targetOffset = circumference - (value / max) * circumference;
    const timeout = setTimeout(() => setOffset(targetOffset), delay + 100); 
    return () => clearTimeout(timeout);
  }, [value, max, circumference, delay]);

  const trackColor = isDarkMode ? "#334155" : "#f1f5f9";

  return (
    <div className="flex flex-col items-center group cursor-pointer">
      <div className="relative w-24 h-24 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r={radius} stroke={trackColor} strokeWidth="8" fill="transparent" />
          <circle 
            cx="48" 
            cy="48" 
            r={radius} 
            stroke={color} 
            strokeWidth="8" 
            fill="transparent" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            strokeLinecap="round"
            className="transition-all duration-[1.5s] ease-out"
          />
        </svg>
        <div className="absolute text-slate-700 dark:text-slate-200 flex flex-col items-center animate-enter" style={{ animationDelay: `${delay + 500}ms` }}>
          <Icon size={18} className="text-slate-400 mb-0.5" />
          <span className="text-xs font-bold">{value}g</span>
        </div>
      </div>
      <div className="text-center mt-2 opacity-0 animate-enter" style={{ animationDelay: `${delay + 600}ms` }}>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{subLabel}</p>
      </div>
    </div>
  );
};

// --- MODALS ---
const MEAL_EMOJIS: Record<string, string> = {
  'Breakfast': '🍳', 'Mid-Morning': '🥜', 'Lunch': '🥗', 'Snack': '🍎', 'Dinner': '🍽️',
};

const DietModal = ({ plan, userId, onClose }: { plan: any; userId: string; onClose: () => void }) => {
  const weekly = plan.weeklySchedule || plan.weekly_schedule || [];
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const [selectedDayIndex, setSelectedDayIndex] = useState(Math.min(todayIndex, Math.max(0, weekly.length - 1)));
  // Per-day diet type override: undefined = 'Non-Veg' (default plan)
  const [dayDietType, setDayDietType] = useState<Record<number, string>>({});
  const [dayOverrides, setDayOverrides] = useState<Record<number, any[]>>({});
  const [loadingAlt, setLoadingAlt]     = useState<number | null>(null);
  const [switchError, setSwitchError]   = useState<string | null>(null);

  if (!plan) return null;

  const days = weekly.length > 0 ? weekly.map((d: any) => d.day) : ['Today'];
  const defaultMeals = weekly.length > 0 ? weekly[selectedDayIndex]?.meals || [] : plan.meals || [];
  const currentMeals = dayOverrides[selectedDayIndex] !== undefined ? dayOverrides[selectedDayIndex] : defaultMeals;
  // 'Non-Veg' is the default; 'Veg' means override was fetched
  const activeDietType = dayDietType[selectedDayIndex] || 'Non-Veg';

  const switchDayDiet = async (dayIndex: number, targetType: string) => {
    const current = dayDietType[dayIndex] || 'Non-Veg';
    setSwitchError(null);

    // Switching back to Non-Veg = revert to original plan instantly (no API needed)
    if (targetType === 'Non-Veg') {
      setDayDietType(prev => { const n = { ...prev }; delete n[dayIndex]; return n; });
      setDayOverrides(prev => { const n = { ...prev }; delete n[dayIndex]; return n; });
      return;
    }

    // Already on Veg — no-op
    if (current === targetType) return;

    // Fetch Veg alternate plan
    setLoadingAlt(dayIndex);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await axios.get(
        `${apiUrl}/api/diet/alt?userId=${encodeURIComponent(userId)}&dietType=${encodeURIComponent(targetType)}`
      );
      const altWeekly = res.data?.weeklySchedule || [];
      const altMeals  = altWeekly[dayIndex]?.meals || [];
      setDayDietType(prev => ({ ...prev, [dayIndex]: targetType }));
      setDayOverrides(prev => ({ ...prev, [dayIndex]: altMeals }));
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to switch. Try again.';
      setSwitchError(msg);
    } finally {
      setLoadingAlt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0a0d18] rounded-3xl shadow-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.8)] w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-indigo-900/30 relative">
        <div className="hidden dark:block absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-start justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Weekly Meal Plan</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full">
                🔥 {plan.dailyCalories} kcal/day
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">💧 {plan.waterIntake}L water</span>
              {plan.budgetLevel && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {plan.budgetLevel === 'Budget' ? '💰 Budget' : '💎 Premium'}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Day Selector */}
        {weekly.length > 0 && (
          <div className="px-5 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            {days.map((day: string, i: number) => (
              <button key={day} onClick={() => setSelectedDayIndex(i)}
                className={`relative px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  i === selectedDayIndex
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/40 scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 hover:scale-105'
                }`}
              >
                {day.slice(0, 3)}
                {dayOverrides[i] && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 border border-white" />}
              </button>
            ))}
          </div>
        )}

        {/* Veg / Non-Veg toggle for selected day */}
        <div className="px-5 pt-2 pb-1 space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Switch today:</span>
            <div className="flex gap-2">
              <button
                onClick={() => switchDayDiet(selectedDayIndex, 'Veg')}
                disabled={loadingAlt !== null}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 disabled:opacity-60 active:scale-95 hover:scale-105 ${
                  activeDietType === 'Veg'
                    ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200 dark:shadow-green-900/40 scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-green-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
              >
                {loadingAlt === selectedDayIndex ? <Loader2 size={12} className="animate-spin" /> : <Leaf size={12} />}
                🌿 Veg
              </button>
              <button
                onClick={() => switchDayDiet(selectedDayIndex, 'Non-Veg')}
                disabled={loadingAlt !== null}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 disabled:opacity-60 active:scale-95 hover:scale-105 ${
                  activeDietType === 'Non-Veg'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200 dark:shadow-orange-900/40 scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                }`}
              >
                {loadingAlt === selectedDayIndex ? <Loader2 size={12} className="animate-spin" /> : <Beef size={12} />}
                🥩 Non-Veg
              </button>
            </div>
          </div>
          {switchError && (
            <p className="text-xs text-red-500 font-medium">{switchError}</p>
          )}
        </div>

        {/* Meals */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {currentMeals.map((meal: any, idx: number) => (
            <div
              key={idx}
              className="animate-slide-up bg-white dark:bg-[#0d1117] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 hover:border-emerald-200 dark:hover:border-emerald-700/40 transition-[transform,box-shadow,border-color] duration-200 cursor-default"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-xl flex-shrink-0 transition-transform duration-200 hover:scale-110">
                  {MEAL_EMOJIS[meal.name] || '🥄'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800 dark:text-white">{meal.name}</h3>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                      🔥 {meal.calories} kcal
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">{meal.description}</p>
                  <div className="flex gap-2 text-xs font-semibold">
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full hover:scale-105 transition-transform">P {meal.protein}g</span>
                    <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full hover:scale-105 transition-transform">C {meal.carbs}g</span>
                    <span className="bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full hover:scale-105 transition-transform">F {meal.fats}g</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:opacity-90 transition-colors text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Per-exercise card with YouTube thumbnail + video
const ExerciseCard = ({ ex, idx, showCheckin = false, checked = false, onToggle }: {
  ex: any; idx: number; showCheckin?: boolean; checked?: boolean; onToggle?: () => void;
}) => {
  const [showVideo, setShowVideo] = useState(false);
  const videoId = getVideoId(ex.name);
  const timing  = getExerciseTiming(ex.name, ex.reps);

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all duration-300 hover-lift neon-card ${
      checked
        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700/40 dark:shadow-[0_0_20px_rgba(16,185,129,0.1)]'
        : 'bg-slate-50 dark:bg-[#0d1117] border-slate-100 dark:border-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-700/50'
    }`}>
      {/* Thumbnail / Video Banner */}
      {!showVideo ? (
        <div className="relative w-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden" style={{ height: '180px' }}>
          {videoId ? (
            <YouTubeThumb id={videoId} alt={ex.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Dumbbell size={32} /><span className="text-xs">No demo available</span>
            </div>
          )}
          <span className="absolute top-3 left-3 z-10 text-xs font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-lg shadow">
            {ex.sets} × {ex.reps}
          </span>
          {timing.isHold && (
            <span className="absolute top-3 right-3 z-10 text-[10px] font-bold bg-amber-500 text-white px-2 py-1 rounded-lg shadow flex items-center gap-1">
              <TimerIcon size={11} /> Timed hold
            </span>
          )}
          {videoId && (
            <button
              onClick={() => setShowVideo(true)}
              className="absolute inset-0 flex items-center justify-center group bg-black/0 hover:bg-black/10 transition-colors duration-200"
            >
              <span className="bg-red-600/90 group-hover:bg-red-600 text-white rounded-full p-3.5 shadow-xl shadow-red-500/30 transition-all duration-200 group-hover:scale-115 group-hover:shadow-red-500/50 group-active:scale-95">
                <Youtube size={24} />
              </span>
              <span className="absolute bottom-3 right-3 bg-black/60 group-hover:bg-black/80 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-colors">▶ Watch</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative w-full" style={{ height: '200px' }}>
          <YouTubePlayer id={videoId!} title={ex.name} autoplay muted onClose={() => setShowVideo(false)} />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-base text-slate-800 dark:text-white">{ex.name}</h3>
          {showCheckin && (
            <button onClick={onToggle} className="flex-shrink-0 mt-0.5">
              {checked
                ? <CheckCircle2 size={22} className="text-emerald-500" />
                : <Circle size={22} className="text-slate-300 dark:text-slate-600 hover:text-indigo-400 transition-colors" />}
            </button>
          )}
        </div>

        {ex.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">{ex.notes}</p>}

        {/* Timer — counts up for holds (planche, dead hang…), down for rests */}
        <div className="flex items-center gap-2 mb-3">
          <TimerButton exercise={ex.name} reps={ex.reps} sets={Number(ex.sets) || 3} />
          {timing.isHold && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {timing.target ? `Prescribed ${timing.target}s` : 'Hold to failure'}
            </span>
          )}
        </div>

        {ex.details && (
          <div className="space-y-2">
            {ex.details.basics?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">How to do it</p>
                <ul className="space-y-1">
                  {ex.details.basics.map((step: string, i: number) => (
                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                      <span className="text-indigo-500 font-bold mt-0.5">{i + 1}.</span>{step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ex.details.cues && (
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1">Coach Cue</p>
                <p className="text-xs text-indigo-900 dark:text-indigo-200 font-medium leading-snug">{ex.details.cues}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const WorkoutModal = ({ day, onClose }: { day: any; onClose: () => void }) => {
  if (!day) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0a0d18] rounded-3xl shadow-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.8)] w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-indigo-900/30 relative">
        <div className="hidden dark:block absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{day.day} — {day.focus}</h2>
            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">{day.exercises.length} exercises</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition text-slate-500"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4">
          {day.exercises.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <span className="text-5xl block mb-3">🛌</span>
              <p className="font-semibold">Rest Day — Recover well!</p>
            </div>
          ) : day.exercises.map((ex: any, idx: number) => (
            <ExerciseCard key={idx} ex={ex} idx={idx} />
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:opacity-90 transition text-sm">Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── Exercise Search View ─────────────────────────────────────────────────────
const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner:     'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  Intermediate: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  Advanced:     'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

const CATEGORY_ICON: Record<string, string> = {
  Chest: '🏋️', Back: '🔙', Legs: '🦵', Shoulders: '💪', Arms: '💪', Core: '🎯', Holds: '⏱️', All: '⚡',
};

const ExerciseSearchView = () => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  // YouTube API state
  const [ytVideos, setYtVideos] = useState<Record<string, YTVideo[]>>({});
  const [ytLoading, setYtLoading] = useState<string | null>(null);

  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Holds'];

  const loadYtVideos = async (exerciseName: string) => {
    if (ytVideos[exerciseName]) return;
    setYtLoading(exerciseName);
    try {
      const results = await searchYouTube(`${exerciseName} exercise tutorial form guide`, 4);
      setYtVideos(prev => ({ ...prev, [exerciseName]: results }));
    } catch {}
    finally { setYtLoading(null); }
  };

  const filtered = EXERCISE_DB.filter(ex => {
    const q = query.toLowerCase();
    const matchesQuery = !q ||
      ex.name.toLowerCase().includes(q) ||
      ex.muscles.some(m => m.toLowerCase().includes(q)) ||
      ex.category.toLowerCase().includes(q);
    const matchesCategory = activeCategory === 'All' || ex.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="opacity-0 animate-enter">
        <h1 className="text-2xl font-bold">
          <span className="text-slate-900 dark:hidden">Exercise Library</span>
          <span className="hidden dark:inline animate-text-gradient">Exercise Library</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-500 text-sm mt-0.5">Search exercises, watch demos, read step-by-step instructions</p>
      </div>

      {/* Search Bar */}
      <div className="opacity-0 animate-enter relative" style={{ animationDelay: '80ms' }}>
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or muscle group…"
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-500/30 dark:focus:border-indigo-700/50 transition-all text-sm shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="opacity-0 animate-enter flex gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ animationDelay: '140ms' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300/30 dark:shadow-indigo-900/50 scale-105'
                : 'bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700/50 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            <span>{CATEGORY_ICON[cat] || '💪'}</span> {cat}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-xs text-slate-400 dark:text-slate-600 font-medium -mt-2">
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
        {query ? ` matching "${query}"` : ` in ${activeCategory}`}
      </p>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((ex, i) => {
          const staticVideoId = getVideoId(ex.name);
          const isExpanded = expandedCard === ex.name;
          const isPlaying  = playingId === ex.name;
          // Use first YouTube API result if available, else fall back to static ID
          const ytFirst    = ytVideos[ex.name]?.[0];
          const activeVideoId = ytFirst?.id || staticVideoId;

          return (
            <div
              key={ex.name}
              className="animate-slide-up bg-white dark:bg-[#0d1117] rounded-2xl border border-slate-100 dark:border-slate-800/60 overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-lg dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-700/40 transition-[transform,box-shadow,border-color] duration-300 neon-card"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Video thumbnail / player */}
              <div className="relative w-full bg-slate-100 dark:bg-slate-800/50" style={{ height: '170px' }}>
                {activeVideoId ? (
                  isPlaying ? (
                    <YouTubePlayer id={activeVideoId} title={ex.name} autoplay muted onClose={() => setPlayingId(null)} />
                  ) : (
                    <button onClick={() => setPlayingId(ex.name)} className="relative w-full h-full group block overflow-hidden">
                      <YouTubeThumb id={activeVideoId} alt={ex.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="bg-red-600 text-white rounded-full p-3 shadow-xl shadow-red-500/30 group-hover:scale-125 transition-transform duration-200">
                          <Youtube size={20} />
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/70 to-transparent flex items-end pb-1.5 px-3">
                        <span className="text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">▶ Watch Demo</span>
                      </div>
                    </button>
                  )
                ) : ytLoading === ex.name ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <button onClick={() => loadYtVideos(ex.name)}
                    className="w-full h-full flex items-center justify-center flex-col gap-2 text-slate-400 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors group">
                    <Youtube size={28} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">Find a demo video</span>
                  </button>
                )}
                {/* Category badge */}
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-600/90 text-white backdrop-blur-sm">
                  {CATEGORY_ICON[ex.category]} {ex.category}
                </span>
                {ytFirst && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600/90 text-white backdrop-blur-sm flex items-center gap-0.5">
                    <Youtube size={9} /> Live
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{ex.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${DIFFICULTY_COLOR[ex.difficulty]}`}>
                    {ex.difficulty}
                  </span>
                </div>

                {/* Muscles & Sets */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {ex.muscles.map(m => (
                    <span key={m} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{m}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex gap-3 text-xs font-bold text-slate-500 dark:text-slate-500">
                    <span className="flex items-center gap-1"><Zap size={11} className="text-indigo-400" />{ex.sets} sets</span>
                    <span className="flex items-center gap-1"><Target size={11} className="text-emerald-400" />{ex.reps}</span>
                  </div>
                  <TimerButton exercise={ex.name} reps={ex.reps} sets={Number(ex.sets) || 3} compact />
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => { const next = isExpanded ? null : ex.name; setExpandedCard(next); if (next) loadYtVideos(ex.name); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-700/50 transition-all duration-200"
                >
                  <span className="flex items-center gap-1.5"><BookOpen size={12} /> {isExpanded ? 'Hide' : 'Show'} Instructions</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded instructions */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 animate-slide-up">
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-700/40">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">How to do it</p>
                      <ol className="space-y-1.5">
                        {ex.details.basics.map((step, si) => (
                          <li key={si} className="flex gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <span className="text-indigo-500 font-bold flex-shrink-0 mt-0.5">{si + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/40">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">💡 Coach Cue</p>
                      <p className="text-xs text-indigo-800 dark:text-indigo-200 font-medium leading-relaxed">{ex.details.cues}</p>
                    </div>
                    {/* YouTube more demos (API results 2-4) */}
                    {ytVideos[ex.name] && ytVideos[ex.name].length > 1 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Youtube size={10} className="text-red-500" /> More demos from YouTube
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {ytVideos[ex.name].slice(1).map(v => (
                            <button key={v.id} onClick={() => setPlayingId(ex.name === playingId ? null : ex.name)}
                              className="flex-shrink-0 w-28 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-600 transition-[border-color] group/yt relative"
                              style={{ height: '60px' }}
                              title={v.title}>
                              <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover/yt:scale-110 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Youtube size={14} className="text-white" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <span className="text-5xl block">🔍</span>
          <p className="font-bold text-slate-600 dark:text-slate-400">No exercises found</p>
          <p className="text-sm text-slate-400">Try a different name or muscle group</p>
          <button onClick={() => { setQuery(''); setActiveCategory('All'); }} className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition">Clear filters</button>
        </div>
      )}
    </div>
  );
};

// ─── Reusable Video Card ───────────────────────────────────────────────────────
const VideoCard = ({ id, title, channel, tag, tagColor, playing, onPlay, onStop, delay = 0 }: any) => (
  <div
    className={`animate-slide-up rounded-2xl overflow-hidden border bg-white dark:bg-[#0d1117] shadow-sm hover:shadow-xl dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-[transform,box-shadow,border-color] duration-300 group/card neon-card ${
      playing ? 'border-red-400 dark:border-red-600/60' : 'border-slate-100 dark:border-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-700/40'
    }`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="relative w-full bg-black" style={{ height: '170px' }}>
      {playing ? (
        <YouTubePlayer id={id} title={title} autoplay onClose={onStop} />
      ) : (
        <button className="relative w-full h-full block overflow-hidden group" onClick={onPlay}>
          <YouTubeThumb id={id} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="bg-red-600 text-white rounded-full p-3 shadow-xl shadow-red-500/40 group-hover:scale-125 transition-transform duration-200">
              <Youtube size={18} />
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/70 to-transparent flex items-end pb-1.5 px-3">
            <span className="text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">▶ Watch Now</span>
          </div>
        </button>
      )}
    </div>
    <div className="p-3">
      {tag && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mb-1.5 ${tagColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
          {tag}
        </span>
      )}
      <p className="text-sm font-bold text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-400 transition-colors">{title}</p>
      <div className="flex items-center justify-between gap-2 mt-0.5">
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{channel}</p>
        <a href={watchUrl(id)} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-[10px] font-semibold text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors whitespace-nowrap">
          YouTube ↗
        </a>
      </div>
    </div>
  </div>
);

// ─── Motivation Videos View ───────────────────────────────────────────────────
const MotivationView = () => {
  const [searchInput, setSearchInput]   = useState('');
  const [activeTag, setActiveTag]       = useState('All');
  const [playingId, setPlayingId]       = useState<string | null>(null);
  const [ytResults, setYtResults]       = useState<YTVideo[] | null>(null);
  const [ytLoading, setYtLoading]       = useState(false);
  const [ytError, setYtError]           = useState('');
  const [liveSearch, setLiveSearch]     = useState(true);

  const TAGS = ['All', 'India', 'Mindset', 'Legend', 'Holds', 'Physique', 'Education', 'Technique'];
  const TAG_COLORS: Record<string, string> = {
    Mindset:   'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
    Legend:    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
    Holds:     'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50',
    Intensity: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50',
    Physique:  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
    Education: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
    Technique: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/50',
    India:     'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/50',
  };

  const QUICK_TAGS = [
    { label: '🇮🇳 Indian Gym', query: 'indian gym motivation bodybuilding' },
    { label: '🔥 Motivation',  query: 'gym motivation 2024' },
    { label: '🦾 CBum',        query: 'Chris Bumstead workout' },
    { label: '🥊 Arnold',      query: 'Arnold Schwarzenegger motivation' },
    { label: '🧠 Mindset',     query: 'gym mindset discipline' },
    { label: '🏋️ Technique',  query: 'gym exercise form tutorial' },
    { label: '🤸 Holds',       query: 'planche dead hang l-sit tutorial' },
  ];

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setActiveTag('All');
    setYtLoading(true);
    setYtError('');
    setYtResults(null);
    try {
      const results = await searchYouTube(`${q} gym workout`, 16);
      if (results.length === 0) setYtError('No results found. Try a different search.');
      else setYtResults(results);
    } catch (err: any) {
      if (err instanceof SearchUnavailable) {
        // No key configured — quietly become a filter over the curated library
        setLiveSearch(false);
        setYtResults(null);
      } else {
        setYtError('Search failed — showing curated videos instead.');
      }
    } finally {
      setYtLoading(false);
    }
  };

  const localFiltered = MOTIVATION_VIDEOS.filter(v => {
    const matchTag = activeTag === 'All' || v.tag === activeTag;
    const matchQ   = !searchInput || v.title.toLowerCase().includes(searchInput.toLowerCase()) || v.channel.toLowerCase().includes(searchInput.toLowerCase());
    return matchTag && matchQ;
  });

  const showingYtResults = ytResults !== null || ytLoading;

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="animate-enter">
        <h1 className="text-2xl font-extrabold">
          <span className="text-slate-900 dark:hidden">Motivation</span>
          <span className="hidden dark:inline animate-text-gradient">Motivation</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
          {liveSearch
            ? 'Search YouTube live, or browse the curated library below'
            : 'Top gym motivation from the world\'s best coaches & athletes'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="animate-enter flex gap-2" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (liveSearch ? handleSearch(searchInput) : null)}
            placeholder={liveSearch ? 'Search YouTube — try "leg day motivation", "planche tutorial"…' : 'Filter curated videos…'}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 dark:focus:border-red-700 text-sm"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setYtResults(null); setYtError(''); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={15} />
            </button>
          )}
        </div>
        {liveSearch && (
          <button onClick={() => handleSearch(searchInput)}
            disabled={ytLoading || !searchInput.trim()}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm flex items-center gap-2 transition-[transform,background-color] duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30 whitespace-nowrap">
            <Youtube size={16} /> {ytLoading ? 'Searching…' : 'Search'}
          </button>
        )}
      </div>

      {/* Quick Search chips (only while live search is available) */}
      {liveSearch && !showingYtResults && (
        <div className="animate-enter flex gap-2 flex-wrap" style={{ animationDelay: '100ms' }}>
          {QUICK_TAGS.map(({ label, query }) => (
            <button key={query} onClick={() => { setSearchInput(query); handleSearch(query); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-red-400 dark:hover:border-red-700/50 hover:text-red-600 dark:hover:text-red-400 transition-[border-color,color,transform] duration-200 hover:scale-105 active:scale-95 whitespace-nowrap">
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Category Tabs (only when showing local curated list) */}
      {!showingYtResults && (
        <div className="animate-enter flex gap-2 overflow-x-auto pb-1" style={{ animationDelay: '120ms' }}>
          {TAGS.map(tag => (
            <button key={tag} onClick={() => setActiveTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-[transform,background-color,border-color] duration-200 hover:scale-105 active:scale-95 ${
                activeTag === tag
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700/50 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}>
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Back to curated button */}
      {showingYtResults && (
        <button onClick={() => { setYtResults(null); setYtError(''); setSearchInput(''); }}
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
          ← Back to curated videos
        </button>
      )}

      {/* YouTube API Results */}
      {ytLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#0d1117]">
              <div className="w-full bg-slate-100 dark:bg-slate-800 animate-pulse" style={{ height: '170px' }} />
              <div className="p-3 space-y-2">
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {ytError && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-600">
          <Youtube size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">{ytError}</p>
        </div>
      )}

      {ytResults && !ytLoading && (
        <>
          <p className="text-xs text-slate-400 dark:text-slate-600 font-medium -mt-1 flex items-center gap-1.5">
            <Youtube size={13} className="text-red-500" /> {ytResults.length} results from YouTube
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ytResults.map((v, i) => (
              <VideoCard key={v.id} {...v} tag="Live" tagColor="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50"
                playing={playingId === v.id} onPlay={() => setPlayingId(v.id)} onStop={() => setPlayingId(null)} delay={i * 50} />
            ))}
          </div>
        </>
      )}

      {/* Curated Videos Grid */}
      {!showingYtResults && (
        <>
          <p className="text-xs text-slate-400 dark:text-slate-600 font-medium -mt-1">
            {localFiltered.length} video{localFiltered.length !== 1 ? 's' : ''}{activeTag !== 'All' ? ` · ${activeTag}` : ' · Curated'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {localFiltered.map((v, i) => (
              <VideoCard key={v.id} id={v.id} title={v.title} channel={v.channel}
                thumbnail={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                tag={v.tag} tagColor={TAG_COLORS[v.tag]}
                playing={playingId === v.id}
                onPlay={() => setPlayingId(v.id)}
                onStop={() => setPlayingId(null)}
                delay={i * 60} />
            ))}
            {localFiltered.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-400 dark:text-slate-600">
                <Youtube size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No videos match</p>
                <p className="text-xs mt-1">Try a different filter</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// --- VIEWS ---

const DashboardView = ({ data, isDarkMode, setShowDietModal }: any) => {
  const { logs, dietPlan, userProfile, weightDiff, isWeightUp, generating, dietError } = data;
  const currentWeight = userProfile?.profile?.currentWeight || 0;
  
  // Format chart data
  const chartData = logs.map((l: any) => ({
      label: new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: l.weight
  }));

  if (chartData.length === 0) {
      chartData.push({ label: 'Start', value: currentWeight });
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center animate-enter">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="text-slate-900 dark:hidden">Good Morning, {userProfile?.user?.name || 'Athlete'}! ☀️</span>
            <span className="hidden dark:inline animate-text-gradient">Good Morning, {userProfile?.user?.name || 'Athlete'}! ☀️</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-0.5">You're doing great. Keep pushing!</p>
        </div>
        <button
            onClick={() => window.location.href = '/progress'}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl hover:shadow-indigo-300/50 hover:scale-105 active:scale-95 font-semibold"
        >
          <Plus size={18} /> <span className="font-medium">Log Progress</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card delay={100} className="p-6 relative group neon-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 dark:group-hover:bg-blue-500/20 dark:group-hover:shadow-[0_0_16px_rgba(59,130,246,0.3)] group-hover:text-white transition-all duration-300">
              <TrendingDown size={24} />
            </div>
            {logs.length > 0 && (
                <span className={`text-xs font-medium px-2 py-1 rounded-lg ${isWeightUp ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {Math.abs(weightDiff).toFixed(1)} kg
                </span>
            )}
          </div>
          <h3 className="text-4xl font-bold text-slate-800 dark:text-white mb-1">
            <CountUp end={currentWeight} /> <span className="text-lg text-slate-400 font-normal">kg</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Current Weight</p>
        </Card>

        <Card delay={200} className="p-6 relative group neon-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-2xl text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 dark:group-hover:bg-orange-500/20 dark:group-hover:shadow-[0_0_16px_rgba(249,115,22,0.3)] group-hover:text-white transition-all duration-300">
              <Flame size={24} />
            </div>
          </div>
          <h3 className="text-4xl font-bold text-slate-800 dark:text-white mb-1">
            <CountUp end={userProfile?.preferences?.daysPerWeek || 0} duration={1500} suffix="" /> <span className="text-lg text-slate-400 font-normal">days/wk</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Target Frequency</p>
        </Card>

        <Card delay={300} className="p-6 relative group neon-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-2xl text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 dark:group-hover:bg-purple-500/20 dark:group-hover:shadow-[0_0_16px_rgba(168,85,247,0.3)] group-hover:text-white transition-all duration-300">
              <Activity size={24} />
            </div>
          </div>
          <h3 className="text-4xl font-bold text-slate-800 dark:text-white mb-1">
            <CountUp end={userProfile?.profile?.bodyFatPercentage || 0} /> <span className="text-lg text-slate-400 font-normal">%</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Body Fat (Est)</p>
        </Card>
      </div>

      {/* Charts & Nutrition Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <Card delay={400} className="col-span-1 lg:col-span-2 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Weight Progress</h3>
          </div>
          <div className="flex-1 h-64 w-full">
            <SmoothLineChart data={chartData} color="#6366f1" isDarkMode={isDarkMode} />
          </div>
        </Card>

        {/* Nutrition Card */}
        <Card delay={500} className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-[#0d0f1e] dark:to-[#0a0c18] text-white relative overflow-hidden border-0 dark:border dark:border-indigo-900/30">
          {/* Neon top line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-aurora-slow" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-bold">Nutrition</h3>
              <p className="text-slate-400 text-sm">Daily Targets</p>
            </div>
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/5">
              <Utensils size={20} className="text-emerald-400" />
            </div>
          </div>
          
          {dietPlan ? (
            <div className="flex justify-between gap-2 mb-8 relative z-10">
                <CircularProgress value={dietPlan.macros.protein} max={200} color="#34d399" icon={Dumbbell} label="Protein" subLabel={`${dietPlan.macros.protein}g`} isDarkMode={true} delay={600} />
                <CircularProgress value={dietPlan.macros.carbs} max={400} color="#60a5fa" icon={Activity} label="Carbs" subLabel={`${dietPlan.macros.carbs}g`} isDarkMode={true} delay={700} />
                <CircularProgress value={dietPlan.macros.fats} max={100} color="#f472b6" icon={Flame} label="Fats" subLabel={`${dietPlan.macros.fats}g`} isDarkMode={true} delay={800} />
            </div>
          ) : dietError ? (
            <div className="flex flex-col items-center justify-center gap-2 mb-8 relative z-10 py-4">
              <p className="text-white/60 text-xs text-center">Could not generate plan.<br />Please complete onboarding first.</p>
            </div>
          ) : (
            <div className="flex justify-between gap-2 mb-8 relative z-10">
              {[0,1,2].map(i => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
                  <div className="w-12 h-2.5 rounded bg-white/10 animate-pulse" />
                </div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/40 text-[10px]">{generating ? 'Building plan…' : 'Loading…'}</p>
              </div>
            </div>
          )}

          {dietPlan && (
            <button onClick={() => setShowDietModal(true)} className="relative z-10 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-all border border-white/10 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
              View Full Diary <ChevronRight size={16} />
            </button>
          )}
        </Card>
      </div>
    </div>
  );
};

// ─── Daily Check-In View ──────────────────────────────────────────────────────
const CheckInView = ({ workoutPlan, userId }: { workoutPlan: any; userId: string }) => {
  const today     = new Date().toISOString().split('T')[0];
  const dayNames  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const todayName = dayNames[new Date().getDay()];
  const todayWorkout = workoutPlan?.schedule?.find((d: any) => d.day === todayName);

  const [checked, setChecked]     = useState<Record<string, boolean>>({});
  const [weight, setWeight]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [logSaved, setLogSaved]   = useState(false);
  const [loadingCheckins, setLoadingCheckins] = useState(true);

  // Load existing checkins for today
  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/checkin/${userId}/${today}`)
      .then(res => {
        const map: Record<string, boolean> = {};
        (res.data || []).forEach((c: any) => { map[c.exerciseName] = !!c.completed; });
        setChecked(map);
      })
      .catch(() => {})
      .finally(() => setLoadingCheckins(false));
  }, [userId, today]);

  const toggleExercise = async (name: string) => {
    const newVal = !checked[name];
    setChecked(prev => ({ ...prev, [name]: newVal }));
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/checkin`, {
        userId, date: today, exerciseName: name,
        workoutDay: todayName, completed: newVal,
      });
    } catch { /* revert on error */
      setChecked(prev => ({ ...prev, [name]: !newVal }));
    }
  };

  const handleLogMeasurement = async () => {
    if (!weight) return;
    setSaving(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/progress/add`, {
        userId,
        weight: Number(weight),
      });
      setLogSaved(true);
      setTimeout(() => setLogSaved(false), 3000);
      setWeight('');
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const exercises   = todayWorkout?.exercises || [];
  const isRestDay   = todayWorkout?.isRestDay || exercises.length === 0;
  const doneCount   = exercises.filter((e: any) => checked[e.name]).length;
  const totalCount  = exercises.length;
  const pct         = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 pb-10 opacity-0 animate-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          <span className="text-slate-900 dark:hidden">Today's Check-In</span>
          <span className="hidden dark:inline animate-text-gradient">Today's Check-In</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-500 text-sm mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Measurements Card */}
      <div className="animate-slide-up bg-white dark:bg-[#0d1117] rounded-2xl border border-slate-100 dark:border-slate-800/60 p-5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:shadow-md dark:hover:border-indigo-700/40 hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-200 neon-card" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Scale size={18} className="text-indigo-500" />
          <h2 className="font-bold text-slate-800 dark:text-white">Log Today's Measurements</h2>
        </div>
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Today's Weight (kg)</label>
          <input
            type="number" step="0.1" placeholder="e.g. 75.5"
            value={weight} onChange={e => setWeight(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleLogMeasurement}
          disabled={saving || !weight}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900/40"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {logSaved ? '✓ Saved!' : 'Log Measurements'}
        </button>
      </div>

      {/* Today's Workout Checklist */}
      <div className="bg-white dark:bg-[#0d1117] rounded-2xl border border-slate-100 dark:border-slate-800/60 overflow-hidden shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] neon-card transition-all duration-200">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={18} className="text-indigo-500" />
              <h2 className="font-bold text-slate-800 dark:text-white">
                {isRestDay ? 'Rest Day' : `${todayName}: ${todayWorkout?.focus || 'Workout'}`}
              </h2>
            </div>
            {!isRestDay && (
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {doneCount}/{totalCount}
              </span>
            )}
          </div>
          {!isRestDay && totalCount > 0 && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        {loadingCheckins ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-400" />
          </div>
        ) : isRestDay ? (
          <div className="p-8 text-center text-slate-400">
            <span className="text-5xl block mb-3">🛌</span>
            <p className="font-semibold text-slate-600 dark:text-slate-300">Rest & Recover</p>
            <p className="text-sm mt-1">No workout scheduled today. Eat well and sleep.</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {exercises.map((ex: any, i: number) => (
              <ExerciseCard
                key={i}
                ex={ex}
                idx={i}
                showCheckin={true}
                checked={!!checked[ex.name]}
                onToggle={() => toggleExercise(ex.name)}
              />
            ))}
          </div>
        )}

        {!isRestDay && doneCount === totalCount && totalCount > 0 && (
          <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 text-center border-t border-emerald-100 dark:border-emerald-800 animate-pop-in">
            <p className="font-bold text-emerald-700 dark:text-emerald-300 text-base">🎉 Workout Complete!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">You crushed it today. Rest up and come back stronger!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ScheduleView = ({ workoutPlan, setWorkoutPlan, setSelectedDay, userId }: any) => {
  const [schedule, setSchedule] = useState<any[]>(workoutPlan?.schedule || []);
  const [reordering, setReordering] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const regeneratePlan = async () => {
    setRegenerating(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/workout/generate`, { userId });
      const newPlan = { ...res.data, schedule: res.data.schedule };
      setSchedule(newPlan.schedule || []);
      setWorkoutPlan(newPlan);
    } catch { /* ignore */ }
    finally { setRegenerating(false); }
  };

  if (!workoutPlan && !regenerating) return (
    <div className="text-center p-10 space-y-4">
      <p className="text-slate-500">No workout plan found.</p>
      <button onClick={regeneratePlan} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">Generate Plan</button>
    </div>
  );

  const moveDay = async (index: number, direction: 'up' | 'down') => {
    const newSchedule = [...schedule];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSchedule.length) return;
    [newSchedule[index], newSchedule[swapIdx]] = [newSchedule[swapIdx], newSchedule[index]];
    setSchedule(newSchedule);
    setReordering(true);
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/workout/reorder`, {
        userId, schedule: newSchedule,
      });
      setWorkoutPlan((prev: any) => ({ ...prev, schedule: newSchedule }));
    } catch { /* revert */
      setSchedule(schedule);
    } finally { setReordering(false); }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-start animate-enter">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="text-slate-900 dark:hidden">Weekly Schedule</span>
            <span className="hidden dark:inline animate-text-gradient">Weekly Schedule</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm">Tap a day to see exercises · Use arrows to reschedule</p>
        </div>
        <div className="flex items-center gap-2">
          {(reordering || regenerating) && <Loader2 size={16} className="animate-spin text-indigo-400" />}
          <button
            onClick={regeneratePlan}
            disabled={regenerating}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900/40"
          >
            <Dumbbell size={12} className={regenerating ? 'animate-bounce' : ''} /> Regenerate
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {schedule.map((item: any, index: number) => (
          <div
            key={index}
            style={{ animationDelay: `${index * 60}ms` }}
            className="animate-enter group relative flex items-center p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0d1117] border-slate-100 dark:border-slate-800/60 hover:shadow-lg dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 hover:border-indigo-200 dark:hover:border-indigo-700/50 cursor-pointer neon-card"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${!item.isRestDay ? 'bg-indigo-500' : 'bg-emerald-400'}`} />

            {/* Day Badge */}
            <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl mr-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
              !item.isRestDay ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.day.substring(0,3)}</span>
              <Dumbbell size={14} className="mt-0.5" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedDay(item)}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${
                  !item.isRestDay
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {item.isRestDay ? 'Rest' : 'Train'}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{item.focus}</h3>
              {!item.isRestDay && (
                <p className="text-xs text-slate-400 mt-0.5">{item.exercises.length} exercises</p>
              )}
            </div>

            {/* Reorder Buttons */}
            <div className="flex flex-col gap-1 ml-3 mr-2">
              <button
                onClick={() => moveDay(index, 'up')}
                disabled={index === 0 || reordering}
                className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-300 hover:text-indigo-500 disabled:opacity-20 transition"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => moveDay(index, 'down')}
                disabled={index === schedule.length - 1 || reordering}
                className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-300 hover:text-indigo-500 disabled:opacity-20 transition"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            <div onClick={() => setSelectedDay(item)} className="cursor-pointer ml-1 text-slate-300 group-hover:text-indigo-400 transition">
              <ChevronRight size={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── AI Trainer ───────────────────────────────────────────────────────────────
interface ChatMessage { id: number; role: 'user' | 'assistant'; content: string; error?: boolean }

const CHAT_STORAGE_KEY = 'guripro.chat';

/**
 * Pull the text out of one Workers AI SSE chunk.
 * Numbered lists arrive as JSON *numbers* (`"response": 1`), and a literal "0"
 * is falsy — so coerce explicitly rather than testing for truthiness.
 */
const sseText = (chunk: any): string => {
  const raw = chunk?.response ?? chunk?.choices?.[0]?.delta?.content ?? chunk?.text;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return String(raw);
  return '';
};

const GREETING: ChatMessage = {
  id: 1,
  role: 'assistant',
  content: "Hi! I'm Guripro Coach. Ask me anything — how to progress your planche, what to eat after training, or how to fix a lift that feels off.",
};

// Lightweight markdown: **bold**, `code`, bullet lists, paragraphs.
const RichText = ({ text }: { text: string }) => {
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={i} className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[0.85em]">{part.slice(1, -1)}</code>;
      return <span key={i}>{part}</span>;
    });

  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
        const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (bullet) return <div key={i} className="flex gap-2"><span className="text-indigo-500 mt-0.5">•</span><span>{inline(bullet[1])}</span></div>;
        if (numbered) return <div key={i} className="flex gap-2"><span className="text-indigo-500 font-bold">{numbered[1]}.</span><span>{inline(numbered[2])}</span></div>;
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{inline(line)}</p>;
      })}
    </div>
  );
};

const AITrainer = ({ userId }: any) => {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput]       = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const abortRef   = useRef<AbortController | null>(null);
  const pinned     = useRef(true);
  const { open: openTimer } = useWorkoutTimer();

  // Restore the conversation so switching tabs doesn't wipe it
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed.slice(-40));
      }
    } catch { /* ignore corrupt history */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40))); } catch { /* quota */ }
  }, [messages]);

  // Only auto-scroll when the user is already at the bottom
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
  };

  useEffect(() => {
    if (pinned.current) chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsTyping(false);
    setStreaming(false);
  };

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || isTyping) return;

    const history = messages
      .filter(m => !m.error && m.id !== GREETING.id)
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));

    const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: text };
    const replyId = Date.now() + 1;
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    pinned.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: text, history }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error('stream unavailable');

      setStreaming(true);
      setMessages(prev => [...prev, { id: replyId, role: 'assistant', content: '' }]);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';

      // Parse Server-Sent Events as they arrive
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const line = evt.split('\n').find(l => l.startsWith('data:'));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const chunk = JSON.parse(payload);
            const piece = sseText(chunk);
            if (piece !== '') {
              answer += piece;
              setMessages(prev => prev.map(m => (m.id === replyId ? { ...m, content: answer } : m)));
            }
          } catch { /* partial JSON — wait for the next chunk */ }
        }
      }

      if (!answer.trim()) {
        // Streaming produced nothing — fall back to the plain endpoint
        const fallback = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/ask`, { userId, message: text, history });
        setMessages(prev => prev.map(m => (m.id === replyId ? { ...m, content: fallback.data.answer } : m)));
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setMessages(prev => prev.filter(m => !(m.id === replyId && !m.content)));
      } else {
        // Last resort: the non-streaming endpoint, then a readable error
        try {
          const fallback = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/ask`, { userId, message: text, history });
          setMessages(prev => [
            ...prev.filter(m => m.id !== replyId),
            { id: replyId, role: 'assistant', content: fallback.data.answer },
          ]);
        } catch {
          setMessages(prev => [
            ...prev.filter(m => m.id !== replyId),
            { id: replyId, role: 'assistant', content: "I couldn't reach the coach just now. Check your connection and try again.", error: true },
          ]);
        }
      }
    } finally {
      abortRef.current = null;
      setIsTyping(false);
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const retry = () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    setMessages(prev => prev.filter(m => !m.error));
    send(lastUser.content);
  };

  const clear = () => {
    stop();
    setMessages([GREETING]);
    try { localStorage.removeItem(CHAT_STORAGE_KEY); } catch { /* ignore */ }
  };

  const QUICK_PROMPTS = [
    { label: 'Modify my workout', prompt: 'Modify today\'s workout — I have limited equipment today.' },
    { label: 'Meal idea',         prompt: 'Suggest a high-protein meal that fits my goal.' },
    { label: 'Form check',        prompt: 'What are the most common form mistakes on my main lift, and how do I fix them?' },
    { label: 'Planche progress',  prompt: 'How do I progress my planche and dead hang holds week to week?' },
  ];

  const lastIsError = messages[messages.length - 1]?.error;

  return (
    <div className="flex flex-col opacity-0 animate-enter h-[calc(100dvh-11rem)] md:h-[calc(100dvh-9rem)]">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-slate-100 dark:border-slate-800 mb-3 md:mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-300/50 dark:shadow-indigo-500/30 animate-glow">
              <span className="font-bold text-lg">AI</span>
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-800 dark:text-white truncate">Guripro Coach</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isTyping ? (streaming ? 'Typing…' : 'Thinking…') : 'Online'}
            </span>
          </div>
        </div>
        <button
          onClick={clear}
          title="Clear conversation"
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto space-y-4 md:space-y-6 pr-1 md:pr-2 mb-3 scrollbar-hide">
        {messages.map(msg => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-enter`}>
            <div className={`flex gap-2.5 md:gap-3 max-w-[88%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`
                w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm
                ${msg.role === 'assistant'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}
              `}>
                {msg.role === 'assistant' ? 'AI' : 'ME'}
              </div>

              <div className={`
                px-4 py-3 shadow-sm text-sm leading-relaxed break-words
                ${msg.role === 'user'
                  ? 'bg-indigo-600 dark:bg-indigo-600/90 text-white rounded-2xl rounded-tr-none shadow-indigo-200 dark:shadow-indigo-900/50'
                  : msg.error
                    ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-2xl rounded-tl-none'
                    : 'bg-white dark:bg-[#0d1117] border border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 rounded-2xl rounded-tl-none dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]'}
              `}>
                {msg.role === 'assistant' ? <RichText text={msg.content} /> : msg.content}
                {msg.role === 'assistant' && !msg.content && streaming && (
                  <span className="inline-block w-1.5 h-4 bg-indigo-400 align-middle animate-pulse rounded-sm" />
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && !streaming && (
          <div className="flex justify-start animate-enter">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[10px] font-bold text-indigo-600">AI</div>
              <div className="bg-white dark:bg-[#0d1117] border border-slate-100 dark:border-slate-800/60 px-4 py-3.5 rounded-2xl rounded-tl-none flex gap-1.5 items-center dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {lastIsError && (
          <div className="flex justify-start">
            <button onClick={retry} className="ml-11 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Try again
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 mb-2.5 overflow-x-auto pb-1 scrollbar-hide">
        {QUICK_PROMPTS.map(({ label, prompt }) => (
          <button
            key={label}
            disabled={isTyping}
            onClick={() => send(prompt)}
            className="whitespace-nowrap px-4 py-2 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => openTimer({ exercise: 'Rest', mode: 'countdown', target: 90, sets: 1 })}
          className="whitespace-nowrap px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-full hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-sm flex items-center gap-1.5"
        >
          <TimerIcon size={12} /> Timer
        </button>
      </div>

      {/* Composer */}
      <div className="glass-panel p-2 rounded-3xl border border-slate-200 dark:border-indigo-900/40 shadow-lg dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex items-end gap-2 transition-all duration-200 focus-within:border-indigo-400/50 dark:focus-within:border-indigo-500/50 dark:focus-within:shadow-[0_4px_24px_rgba(99,102,241,0.15)]">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Ask Guripro Coach…  (Shift + Enter for a new line)"
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 p-2 outline-none resize-none max-h-[140px]"
        />
        {isTyping ? (
          <button
            onClick={stop}
            title="Stop generating"
            className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full transition-all hover:scale-110 active:scale-90 flex-shrink-0"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            onClick={() => send()}
            disabled={!input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all hover:scale-110 active:scale-90 shadow-lg shadow-indigo-200 dark:shadow-none flex-shrink-0"
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

// Opens the timer with no exercise attached — handy between sets
const QuickTimerButton = ({ className = '', label }: { className?: string; label?: string }) => {
  const { open, isRunning } = useWorkoutTimer();
  return (
    <button
      onClick={() => open({ exercise: 'Rest', mode: 'countdown', target: 90, sets: 1 })}
      title="Open workout timer"
      className={className}
    >
      <TimerIcon size={20} className={isRunning ? 'animate-pulse text-indigo-500' : ''} />
      {label && <span>{label}</span>}
    </button>
  );
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Real Data State
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dietError, setDietError] = useState(false);
  
  // Modal State
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [showDietModal, setShowDietModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedId = localStorage.getItem('userId');
    if (token && storedId) {
      setUserId(storedId);
      loadDashboardData(storedId);
    } else {
        if (typeof window !== 'undefined') window.location.href = '/login';
    }
  }, []);

  const loadDashboardData = async (id: string) => {
    setLoading(true);
    try {
      // Fetch everything in parallel — profile, logs, and both plans at once
      const [logsRes, userRes, wRes, dRes] = await Promise.allSettled([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/progress/${id}`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/${id}`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/workout/${id}`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/diet/${id}`),
      ]);

      const logsData    = logsRes.status    === 'fulfilled' ? logsRes.value.data    : [];
      const profileData = userRes.status    === 'fulfilled' ? userRes.value.data    : {};
      let   workoutData = wRes.status       === 'fulfilled' ? wRes.value.data       : null;
      let   dietData    = dRes.status       === 'fulfilled' ? dRes.value.data       : null;

      setLogs(logsData || []);
      setUserProfile(profileData || {});
      setWorkoutPlan(workoutData);
      setDietPlan(dietData);

      // Show UI immediately — generate missing plans in background
      setLoading(false);

      if (!workoutData || !dietData) {
        setGenerating(true);
        setDietError(false);
        try {
          const genPromises = [];
          if (!workoutData) genPromises.push(
            axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/workout/generate`, { userId: id })
              .then(r => setWorkoutPlan(r.data)).catch(() => {})
          );
          if (!dietData) genPromises.push(
            axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/diet/generate`, { userId: id })
              .then(r => { setDietPlan(r.data); setDietError(false); })
              .catch(() => setDietError(true))
          );
          await Promise.all(genPromises);
        } finally {
          setGenerating(false);
        }
      }
    } catch (err) {
      console.error("Dashboard Load Error", err);
      setLoading(false);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const navItems = [
    { id: 'dashboard',   label: 'Overview',    icon: LayoutDashboard   },
    { id: 'checkin',     label: 'Check In',    icon: ClipboardCheck    },
    { id: 'schedule',    label: 'Schedule',    icon: CalendarDays      },
    { id: 'exercises',   label: 'Exercises',   icon: BookOpen          },
    { id: 'community',   label: 'Community',   icon: Users             },
    { id: 'motivation',  label: 'Motivation',  icon: Youtube           },
    { id: 'trainer',     label: 'AI Trainer',  icon: MessageSquareText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060810] relative overflow-hidden">
        {/* Aurora orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[130px] opacity-25 bg-indigo-700 animate-aurora" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[110px] opacity-20 bg-violet-700 animate-aurora-slow" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(129,140,248,1) 1px,transparent 1px),linear-gradient(90deg,rgba(129,140,248,1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-4 rounded-2xl shadow-2xl shadow-indigo-500/40 animate-glow">
            <Dumbbell size={36} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold animate-text-gradient">Loading Dashboard...</h2>
            <p className="text-slate-500 text-sm">Fetching your profile and data</p>
          </div>
          {/* Animated dots */}
          <div className="flex gap-2 mt-2">
            {[0,1,2,3].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate Data for Views
  const currentWeight = userProfile?.profile?.currentWeight || 0;
  const startWeight = logs.length > 0 ? logs[0].weight : currentWeight;
  const weightDiff = currentWeight - startWeight;
  const isWeightUp = weightDiff > 0;

  return (
    <WorkoutTimerProvider themeClass={isDarkMode ? 'dark' : ''}>
      <GlobalStyles />
      <div className={isDarkMode ? "dark" : ""}>
        <div className="flex h-screen bg-slate-50 dark:bg-[#060810] font-sans text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-500">
          
          {/* Dark Aurora Background */}
          <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {/* Light mode orbs */}
            <div className="dark:hidden absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[100px] animate-pulse" />
            <div className="dark:hidden absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-200/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
            {/* Dark mode aurora mesh */}
            <div className="hidden dark:block absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[130px] opacity-30 bg-indigo-700 animate-aurora" />
            <div className="hidden dark:block absolute top-[10%] right-[-15%] w-[45%] h-[45%] rounded-full blur-[120px] opacity-20 bg-violet-700 animate-aurora-slow" />
            <div className="hidden dark:block absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full blur-[110px] opacity-25 bg-cyan-800 animate-aurora-med" />
            <div className="hidden dark:block absolute bottom-[5%] right-[5%] w-[30%] h-[30%] rounded-full blur-[100px] opacity-15 bg-fuchsia-800 animate-float-delayed" />
            {/* Subtle grid overlay */}
            <div className="hidden dark:block absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(129,140,248,1) 1px,transparent 1px),linear-gradient(90deg,rgba(129,140,248,1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
          </div>

          {/* Sidebar (Glassmorphism) */}
          <aside className="hidden md:flex flex-col w-72 glass-panel border-r border-slate-100/50 dark:border-indigo-900/20 p-6 z-10 transition-colors duration-300 relative">
            {/* Sidebar top glow line */}
            <div className="hidden dark:block absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            <div className="flex items-center gap-3 mb-12 px-2">
              <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/40 dark:shadow-indigo-500/30 animate-glow">
                <Dumbbell size={24} />
              </div>
              <span className="text-2xl font-extrabold tracking-tight">
                <span className="text-black dark:hidden">FitTrack</span>
                <span className="hidden dark:inline animate-text-gradient">FitTrack</span>
                <span className="text-indigo-600 dark:text-indigo-400">Pro</span>
              </span>
            </div>

            <nav className="space-y-2 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium group relative overflow-hidden active:scale-[0.98]
                      ${isActive
                        ? 'text-indigo-700 dark:text-indigo-200 shadow-md shadow-indigo-100 dark:shadow-indigo-900/30 nav-active-glow'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/5 hover:text-black dark:hover:text-white hover:translate-x-1'}
                    `}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 via-indigo-50/60 to-transparent dark:from-indigo-500/10 dark:via-indigo-500/5 dark:to-transparent border-l-4 border-indigo-500 dark:border-indigo-400 opacity-100 rounded-2xl" />
                    )}
                    <Icon size={20} className={`relative z-10 transition-all duration-200 group-hover:scale-110 ${isActive ? 'text-indigo-600 dark:text-indigo-300 drop-shadow-sm' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="relative z-10 text-sm tracking-tight">{item.label}</span>
                    {isActive && <span className="ml-auto relative z-10 w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_6px_rgba(129,140,248,0.8)]" />}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 space-y-2">
                {/* Edit Profile Button */}
                <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-900 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-800">
                     <Pencil size={16} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Edit My Data</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">Profile, Goals & Prefs</p>
                  </div>
                </button>

                {/* Logout Button */}
                <button
                    onClick={() => { localStorage.removeItem('userId'); localStorage.removeItem('token'); localStorage.removeItem('userEmail'); window.location.href='/login'; }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-900 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                     <User size={18} className="text-slate-700 dark:text-slate-300" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-black dark:text-white group-hover:text-indigo-700 transition-colors">
                        {userProfile?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-500">Log Out</p>
                  </div>
                </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
            
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-slate-100 dark:border-slate-800 z-20">
               <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                 <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                    <Dumbbell size={18} />
                 </div>
                 FitTrackPro
               </div>
               <div className="flex items-center gap-1">
                 <QuickTimerButton className="p-2 text-slate-600 dark:text-slate-300" />
                 <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300">
                    <MoreHorizontal />
                 </button>
               </div>
            </div>

             {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
              <div className="absolute top-16 left-0 w-full glass-panel border-b border-slate-100 dark:border-slate-800 shadow-xl z-10 md:hidden p-4 space-y-2 animate-enter">
                 {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === item.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      <item.icon size={20} /> {item.label}
                    </button>
                 ))}
                 <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                   <button onClick={toggleTheme} className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-600 dark:text-slate-300">
                     {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                     {isDarkMode ? "Light Mode" : "Dark Mode"}
                   </button>
                 </div>
              </div>
            )}

            {/* Top Bar */}
            <header className="hidden md:flex items-center justify-between px-8 py-5">
               <div className="relative w-96 group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search workouts, meals, or stats..." 
                   className="w-full glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 transition-all text-slate-900 dark:text-white shadow-sm"
                 />
               </div>
               <div className="flex items-center gap-4">
                 <button className="p-3 glass-panel border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 relative transition-all hover:-translate-y-0.5 hover:shadow-md">
                   <Bell size={20} />
                   <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                 </button>
                 <button 
                  onClick={toggleTheme}
                  className="p-3 glass-panel border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-md"
                 >
                   {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                 </button>
                 <QuickTimerButton className="p-3 glass-panel border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-md" />
               </div>
            </header>

            {/* Generating banner */}
            {generating && (
              <div className="flex items-center gap-3 px-5 py-2.5 bg-indigo-600/10 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
                <span className="text-xs font-semibold">Building your personalised plan — this takes a few seconds…</span>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 md:pt-2 pb-24 scrollbar-hide">
              <div className="max-w-6xl mx-auto">
                 {activeTab === 'dashboard' && (
                    <DashboardView
                      data={{ logs, dietPlan, userProfile, weightDiff, isWeightUp, generating, dietError }}
                      isDarkMode={isDarkMode}
                      setShowDietModal={setShowDietModal}
                    />
                 )}
                 {activeTab === 'checkin' && workoutPlan && userId && (
                    <CheckInView workoutPlan={workoutPlan} userId={userId} />
                 )}
                 {activeTab === 'schedule' && (
                    <ScheduleView
                      workoutPlan={workoutPlan}
                      setWorkoutPlan={setWorkoutPlan}
                      setSelectedDay={setSelectedDay}
                      userId={userId}
                    />
                 )}
                 {activeTab === 'exercises' && <ExerciseSearchView />}
                 {activeTab === 'community' && userId && <CommunityView userId={userId} />}
                 {activeTab === 'motivation' && <MotivationView />}
                 {activeTab === 'trainer' && <AITrainer userId={userId} />}
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* Global Modals */}
      {selectedDay && (
        <WorkoutModal day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
      {showDietModal && dietPlan && userId && (
        <DietModal plan={dietPlan} userId={userId} onClose={() => setShowDietModal(false)} />
      )}
      {showEditModal && (
        <EditProfileModal
          userProfile={userProfile}
          userId={userId}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            if (userId) loadDashboardData(userId);
          }}
        />
      )}
    </WorkoutTimerProvider>
  );
}