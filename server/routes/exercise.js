const express = require('express');
const router = express.Router();

const gifCache = {};

// Direct wger.de image URLs — verified, no API call needed
const EXERCISE_IMAGES = {
  // ── Chest ──────────────────────────────────────────────────────────────────
  'bench press':              'https://wger.de/media/exercise-images/192/Bench-press-1.png',
  'barbell bench press':      'https://wger.de/media/exercise-images/192/Bench-press-1.png',
  'dumbbell bench press':     'https://wger.de/media/exercise-images/97/Dumbbell-bench-press-1.png',
  'incline bench press':      'https://wger.de/media/exercise-images/41/Incline-bench-press-1.png',
  'incline press':            'https://wger.de/media/exercise-images/16/Incline-press-1.png',
  'decline bench press':      'https://wger.de/media/exercise-images/100/Decline-bench-press-1.png',
  'close grip bench press':   'https://wger.de/media/exercise-images/61/Close-grip-bench-press-1.png',
  'narrow grip bench press':  'https://wger.de/media/exercise-images/88/Narrow-grip-bench-press-1.png',
  'chest fly':                'https://wger.de/media/exercise-images/98/Butterfly-machine-2.png',
  'cable fly':                'https://wger.de/media/exercise-images/71/Cable-crossover-2.png',
  'cable crossover':          'https://wger.de/media/exercise-images/71/Cable-crossover-2.png',
  'incline cable fly':        'https://wger.de/media/exercise-images/122/Incline-cable-flyes-1.png',
  'push-up':                  'https://wger.de/media/exercise-images/192/Bench-press-1.png',
  'push up':                  'https://wger.de/media/exercise-images/192/Bench-press-1.png',

  // ── Back ───────────────────────────────────────────────────────────────────
  'deadlift':                 'https://wger.de/media/exercise-images/161/Dead-lifts-2.png',
  'romanian deadlift':        'https://wger.de/media/exercise-images/161/Dead-lifts-2.png',
  'stiff leg deadlift':       'https://wger.de/media/exercise-images/161/Dead-lifts-2.png',
  'pull-up':                  'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
  'pull up':                  'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
  'chin-up':                  'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
  'chin up':                  'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
  'lat pulldown':             'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
  'barbell row':              'https://wger.de/media/exercise-images/70/Reverse-grip-bent-over-rows-1.png',
  'bent over row':            'https://wger.de/media/exercise-images/70/Reverse-grip-bent-over-rows-1.png',
  'bent-over row':            'https://wger.de/media/exercise-images/70/Reverse-grip-bent-over-rows-1.png',
  'cable row':                'https://wger.de/media/exercise-images/143/Cable-seated-rows-2.png',
  'seated cable row':         'https://wger.de/media/exercise-images/143/Cable-seated-rows-2.png',
  't-bar row':                'https://wger.de/media/exercise-images/106/T-bar-row-1.png',
  'hyperextension':           'https://wger.de/media/exercise-images/128/Hyperextensions-1.png',
  'good morning':             'https://wger.de/media/exercise-images/116/Good-mornings-2.png',
  'good mornings':            'https://wger.de/media/exercise-images/116/Good-mornings-2.png',

  // ── Shoulders ──────────────────────────────────────────────────────────────
  'overhead press':           'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png',
  'military press':           'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png',
  'shoulder press':           'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png',
  'barbell shoulder press':   'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png',
  'dumbbell shoulder press':  'https://wger.de/media/exercise-images/123/dumbbell-shoulder-press-large-1.png',
  'arnold press':             'https://wger.de/media/exercise-images/123/dumbbell-shoulder-press-large-1.png',
  'lateral raise':            'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-2.png',
  'dumbbell lateral raise':   'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-2.png',
  'shrug':                    'https://wger.de/media/exercise-images/150/Barbell-shrugs-1.png',
  'barbell shrug':            'https://wger.de/media/exercise-images/150/Barbell-shrugs-1.png',
  'dumbbell shrug':           'https://wger.de/media/exercise-images/151/Dumbbell-shrugs-2.png',
  'face pull':                'https://wger.de/media/exercise-images/143/Cable-seated-rows-2.png',

  // ── Arms ───────────────────────────────────────────────────────────────────
  'barbell curl':             'https://wger.de/media/exercise-images/81/Biceps-curl-1.png',
  'bicep curl':               'https://wger.de/media/exercise-images/81/Biceps-curl-1.png',
  'biceps curl':              'https://wger.de/media/exercise-images/129/Standing-biceps-curl-1.png',
  'dumbbell curl':            'https://wger.de/media/exercise-images/74/Bicep-curls-1.png',
  'hammer curl':              'https://wger.de/media/exercise-images/86/Bicep-hammer-curl-1.png',
  'hammer curls':             'https://wger.de/media/exercise-images/138/Hammer-curls-with-rope-1.png',
  'preacher curl':            'https://wger.de/media/exercise-images/193/Preacher-curl-3-1.png',
  'skullcrusher':             'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',
  'skullcrushers':            'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',
  'skull crusher':            'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',
  'tricep dip':               'https://wger.de/media/exercise-images/83/Bench-dips-1.png',
  'bench dip':                'https://wger.de/media/exercise-images/83/Bench-dips-1.png',
  'dip':                      'https://wger.de/media/exercise-images/83/Bench-dips-1.png',
  'dips':                     'https://wger.de/media/exercise-images/83/Bench-dips-1.png',

  // ── Legs ───────────────────────────────────────────────────────────────────
  'squat':                    'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
  'back squat':               'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
  'barbell squat':            'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
  'front squat':              'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
  'goblet squat':             'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
  'hack squat':               'https://wger.de/media/exercise-images/130/Narrow-stance-hack-squats-1-1024x721.png',
  'lunge':                    'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
  'walking lunge':            'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
  'leg raise':                'https://wger.de/media/exercise-images/125/Leg-raises-2.png',
  'hanging leg raise':        'https://wger.de/media/exercise-images/125/Leg-raises-2.png',

  // ── Core ───────────────────────────────────────────────────────────────────
  'crunch':                   'https://wger.de/media/exercise-images/91/Crunches-1.png',
  'crunches':                 'https://wger.de/media/exercise-images/91/Crunches-1.png',
  'decline crunch':           'https://wger.de/media/exercise-images/93/Decline-crunch-1.png',
  'sit-up':                   'https://wger.de/media/exercise-images/91/Crunches-1.png',
  'sit up':                   'https://wger.de/media/exercise-images/91/Crunches-1.png',
  'cross body crunch':        'https://wger.de/media/exercise-images/176/Cross-body-crunch-1.png',
  'plank':                    'https://wger.de/media/exercise-images/125/Leg-raises-2.png',

  // ── Rest / Warm-up ─────────────────────────────────────────────────────────
  'light walk':               'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
  'stretch':                  'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
  'warm up':                  'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
  'cool down':                'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
};

function lookupImage(name) {
  const key = name.toLowerCase().trim();

  // Exact match
  if (EXERCISE_IMAGES[key]) return EXERCISE_IMAGES[key];

  // Partial match — longest key that is contained in the query wins
  let best = null;
  let bestLen = 0;
  for (const [k, url] of Object.entries(EXERCISE_IMAGES)) {
    if (key.includes(k) && k.length > bestLen) {
      best = url;
      bestLen = k.length;
    }
  }
  return best;
}

// GET /api/exercise/gif?name=Squat
router.get('/gif', async (req, res) => {
  try {
    const name = (req.query.name || '').trim().toLowerCase();
    if (!name) return res.status(400).json({ error: 'name query param required' });

    if (gifCache[name] !== undefined) return res.json({ gifUrl: gifCache[name] });

    // ── Strategy 1: ExerciseDB via RapidAPI (animated GIFs when subscribed) ──
    if (process.env.RAPIDAPI_KEY) {
      try {
        const rapidRes = await fetch(
          `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name)}?limit=1`,
          {
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
            },
          }
        );
        if (rapidRes.ok) {
          const data = await rapidRes.json();
          if (Array.isArray(data) && data.length > 0 && data[0].gifUrl) {
            gifCache[name] = data[0].gifUrl;
            return res.json({ gifUrl: data[0].gifUrl });
          }
        }
      } catch (e) {
        console.warn('ExerciseDB unavailable, using static fallback');
      }
    }

    // ── Strategy 2: Static curated image map ─────────────────────────────────
    const imageUrl = lookupImage(name);
    gifCache[name] = imageUrl;
    return res.json({ gifUrl: imageUrl });

  } catch (err) {
    console.error('Exercise GIF error:', err.message);
    res.status(500).json({ error: 'Failed to fetch exercise GIF' });
  }
});

module.exports = router;
