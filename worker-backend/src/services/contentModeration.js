/**
 * Fitness-only content moderation.
 *
 * A cascade, cheapest stage first, so the expensive model only sees posts the
 * cheap stages couldn't decide:
 *
 *   0. safety      — llama-guard-3-8b: is this harmful? (separate axis to topic)
 *   1. lexicon     — free keyword scoring, settles the obvious cases
 *   2. embeddings  — bge-base-en similarity against fitness / off-topic anchors
 *   3. adjudicator — llama-3.1-8b JSON verdict, only for the uncertain band
 *
 * Every stage returns a score and a human-readable reason, because a strict
 * topic filter *will* misfire and the user deserves to be told why.
 */

// ─── Tunables ─────────────────────────────────────────────────────────────────
export const THRESHOLDS = {
  /** At or above this the post is clearly on-topic — publish without asking a model. */
  lexiconAllow: 3.0,
  /** At or below this the lexicon is confident it's off-topic spam. */
  lexiconBlock: -3.0,
  /** Cosine similarity to the fitness centroid above which we publish. */
  embedAllow: 0.42,
  /** Below this the embedding stage is confident the post is unrelated. */
  embedBlock: 0.24,
  /** Adjudicator confidence needed to hard-block rather than queue for review. */
  blockConfidence: 0.75,
};

// ─── Stage 1: lexicon ─────────────────────────────────────────────────────────
// Weighted so a single strong term ("deadlift") outweighs incidental ones ("gym"
// appears in plenty of off-topic posts).

const STRONG_FITNESS = [
  'deadlift', 'squat', 'bench press', 'overhead press', 'lat pulldown', 'barbell', 'dumbbell',
  'kettlebell', 'hypertrophy', 'progressive overload', 'rep range', 'drop set', 'superset',
  'planche', 'dead hang', 'l-sit', 'muscle up', 'pull-up', 'pull up', 'chin-up', 'push-up',
  'ppl split', 'push pull legs', 'upper lower', 'bro split', 'deload', 'one rep max', '1rm',
  'pr ', ' pb ', 'personal best', 'form check', 'rest day', 'cardio', 'hiit', 'zone 2',
  'macros', 'protein intake', 'caloric deficit', 'caloric surplus', 'bulking', 'cutting',
  'creatine', 'whey', 'dexa', 'body fat', 'lean mass', 'rir', 'rpe', 'tempo reps',
  'hamstring', 'quadriceps', 'glutes', 'lats', 'delts', 'triceps', 'biceps', 'calves',
  'mobility', 'stretching', 'physio', 'rehab', 'warm-up', 'cool down', 'doms',
  'calisthenics', 'powerlifting', 'crossfit', 'bodybuilding', 'marathon', 'sprint',
  'workout', 'training session', 'gym session', 'lifting', 'reps', 'sets',
];

const WEAK_FITNESS = [
  'gym', 'fit', 'fitness', 'muscle', 'strength', 'weight', 'diet', 'nutrition', 'health',
  'coach', 'trainer', 'exercise', 'run', 'running', 'yoga', 'pilates', 'swim', 'cycling',
  'meal', 'recovery', 'sleep', 'progress', 'transformation', 'physique', 'stamina',
];

// Things that flood fitness feeds and are emphatically not fitness content.
const OFF_TOPIC = [
  // financial spam
  'crypto', 'bitcoin', 'forex', 'trading signals', 'nft', 'airdrop', 'investment opportunity',
  'make money online', 'work from home', 'passive income', 'binary options', 'casino',
  'betting', 'lottery', 'loan approval', 'credit repair',
  // MLM / dropship spam
  'dm me to join', 'link in bio to buy', 'limited stock', 'affiliate link', 'promo code',
  'business opportunity', 'be your own boss', 'join my team',
  // unrelated verticals
  'real estate', 'car for sale', 'apartment for rent', 'job vacancy', 'hiring now',
  'movie review', 'election', 'political party', 'vote for', 'stock market',
  'dating app', 'onlyfans', 'follow for follow', 'sub4sub',
];

const norm = (s) => ` ${String(s || '').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ')} `;

export const lexiconScore = (text) => {
  const t = norm(text);
  const hits = { strong: [], weak: [], off: [] };
  let score = 0;

  for (const term of STRONG_FITNESS) {
    if (t.includes(term)) { score += 2.0; hits.strong.push(term.trim()); }
  }
  for (const term of WEAK_FITNESS) {
    if (t.includes(` ${term} `) || t.includes(` ${term}s `)) { score += 0.6; hits.weak.push(term); }
  }
  for (const term of OFF_TOPIC) {
    if (t.includes(term)) { score -= 3.0; hits.off.push(term); }
  }

  // A wall of hashtags with no substance is spam behaviour regardless of topic
  const hashtags = (String(text || '').match(/#/g) || []).length;
  if (hashtags > 12) score -= 2.0;

  return { score, hits };
};

// ─── Stage 2: embeddings ──────────────────────────────────────────────────────
const FITNESS_ANCHORS = [
  'A training log describing sets, reps and weights lifted at the gym.',
  'A question about exercise form, technique or programming.',
  'Progress on a physique or strength goal, including before and after photos.',
  'Nutrition, macros, meal prep and supplements for athletic performance.',
  'Injury recovery, mobility work and physiotherapy for training.',
  'Running, cycling, swimming or endurance training and race preparation.',
  'Motivation and consistency in a workout routine.',
  'Calisthenics skills such as planche, muscle up, dead hang and L-sit.',
];

const OFF_TOPIC_ANCHORS = [
  'Cryptocurrency, trading signals and investment promotions.',
  'Advertising an unrelated product, job vacancy or business opportunity.',
  'Political commentary, news events and elections.',
  'Celebrity gossip, movies, music and television.',
  'Dating, relationships and personal drama unrelated to training.',
  'Random everyday chat with no connection to exercise or health.',
];

const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const mag = (a) => Math.sqrt(dot(a, a));
const cosine = (a, b) => {
  const m = mag(a) * mag(b);
  return m === 0 ? 0 : dot(a, b) / m;
};

const centroid = (vectors) => {
  const out = new Array(vectors[0].length).fill(0);
  for (const v of vectors) for (let i = 0; i < v.length; i++) out[i] += v[i];
  return out.map(x => x / vectors.length);
};

/** Anchors are static, so embed them once per isolate and reuse. */
let anchorCache = null;

const getAnchors = async (env) => {
  if (anchorCache) return anchorCache;
  const res = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: [...FITNESS_ANCHORS, ...OFF_TOPIC_ANCHORS],
  });
  const vectors = res.data;
  anchorCache = {
    fitness: centroid(vectors.slice(0, FITNESS_ANCHORS.length)),
    offTopic: centroid(vectors.slice(FITNESS_ANCHORS.length)),
  };
  return anchorCache;
};

export const embeddingScore = async (text, env) => {
  const anchors = await getAnchors(env);
  const res = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [String(text).slice(0, 1500)] });
  const vec = res.data[0];
  const fitness = cosine(vec, anchors.fitness);
  const offTopic = cosine(vec, anchors.offTopic);
  return { fitness, offTopic, margin: fitness - offTopic };
};

// ─── Stage 0: safety ──────────────────────────────────────────────────────────
/** Topic and safety are different questions — a post can be on-topic and still harmful. */
export const safetyCheck = async (text, env) => {
  try {
    const res = await env.AI.run('@cf/meta/llama-guard-3-8b', {
      messages: [{ role: 'user', content: String(text).slice(0, 3000) }],
    });
    const raw = (res?.response?.response ?? res?.response ?? '').toString().toLowerCase();
    const unsafe = raw.includes('unsafe');
    const categories = (raw.match(/s\d{1,2}/g) || []);
    return { safe: !unsafe, categories, raw: raw.slice(0, 120) };
  } catch (err) {
    // Never let a safety-model outage block posting outright — fall through to review
    return { safe: true, categories: [], error: err.message?.slice(0, 120) };
  }
};

// ─── Stage 3: adjudicator ─────────────────────────────────────────────────────
// `@cf/meta/llama-3.1-8b-instruct` was deprecated 2026-05-30 — don't add it back.
const ADJUDICATOR_MODELS = [
  '@cf/meta/llama-3.1-8b-instruct-fast',
  '@cf/meta/llama-3.1-8b-instruct-fp8',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
];

const ADJUDICATOR_PROMPT = `You moderate a social platform exclusively for fitness content.

ON TOPIC: workouts, training logs, exercise form, programming, strength, calisthenics,
running and endurance, sports performance, nutrition and macros for training, supplements,
recovery, sleep and mobility for athletes, injury rehab, progress updates and physique
photos, gym culture, motivation tied to training.

Also ON TOPIC — do not reject these:
- rest days, deloads, missed sessions, and the eating/downtime around them
- gym gear, shoes and equipment, including buying and selling it between members
- the emotional side of training: burnout, confidence, mental health alongside the gym
- short gym-culture shorthand ("leg day", "5am club") and posts in Hinglish or mixed languages

OFF TOPIC: crypto and trading, unrelated product promotion, job ads, politics, news,
celebrity gossip, dating drama with no training angle, general chat with no connection
to training or the body at all.

Judge ONLY the topic, not the writing quality. A short post like "PR today, 140kg x 3"
is on topic. A post that merely name-drops the gym while promoting an unrelated
business is off topic. When genuinely unsure, prefer onTopic:true with low confidence —
a human reviews those.

Respond with ONLY compact JSON, no prose:
{"onTopic":true|false,"confidence":0.0-1.0,"topic":"<2-4 word label>","reason":"<one short sentence>"}`;

/**
 * Workers AI is inconsistent about response shape across models — some return
 * a string, some `{response:{response}}`, some an OpenAI-style choices array.
 */
export const extractText = (res) => {
  if (typeof res === 'string') return res;
  const r = res?.response ?? res?.result?.response ?? res?.output ?? '';
  if (typeof r === 'string') return r;
  if (typeof r?.response === 'string') return r.response;
  if (Array.isArray(r?.choices)) return r.choices[0]?.message?.content ?? '';
  if (Array.isArray(res?.choices)) return res.choices[0]?.message?.content ?? '';
  return '';
};

export const adjudicate = async (text, env) => {
  for (const model of ADJUDICATOR_MODELS) {
    try {
      const res = await env.AI.run(model, {
        messages: [
          { role: 'system', content: ADJUDICATOR_PROMPT },
          { role: 'user', content: `POST:\n"""${String(text).slice(0, 2000)}"""` },
        ],
        max_tokens: 160,
        temperature: 0.1,
      });
      const body = extractText(res).trim();
      const match = body.match(/\{[\s\S]*\}/);
      if (!match) continue;
      const parsed = JSON.parse(match[0]);
      return {
        onTopic: !!parsed.onTopic,
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
        topic: String(parsed.topic || 'unclear').slice(0, 40),
        reason: String(parsed.reason || '').slice(0, 200),
        model,
      };
    } catch (err) {
      console.warn(`Adjudicator [${model}] failed:`, err.message?.slice(0, 120));
    }
  }
  return null;
};

// ─── Images ───────────────────────────────────────────────────────────────────
/**
 * Describe an image, then judge the description with the same text cascade.
 * Captioning is the expensive part, so its result is stored on the post and
 * reused if the post is ever re-reviewed.
 */
export const describeImage = async (bytes, env) => {
  const input = [...new Uint8Array(bytes)];
  const out = { caption: '', labels: [] };

  try {
    const res = await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      image: input,
      prompt: 'Describe this image in one sentence. Mention any gym equipment, exercise, food or text you can see.',
      max_tokens: 100,
    });
    out.caption = (res?.description || res?.response || '').trim();
  } catch (err) {
    console.warn('llava failed:', err.message?.slice(0, 120));
  }

  try {
    const res = await env.AI.run('@cf/microsoft/resnet-50', { image: input });
    out.labels = (Array.isArray(res) ? res : [])
      .filter(r => r.score > 0.12)
      .slice(0, 5)
      .map(r => r.label);
  } catch (err) {
    console.warn('resnet-50 failed:', err.message?.slice(0, 120));
  }

  return out;
};

// ─── Orchestrator ─────────────────────────────────────────────────────────────
/**
 * @returns {{verdict:'allow'|'review'|'block', stage:string, score:number,
 *            topic:string, reason:string, detail:object}}
 */
export const moderatePost = async (
  { text = '', imageBytes = null, imageDescription = null },
  env = {},
) => {
  const detail = {};
  const stamp = (verdict, stage, score, topic, reason) =>
    ({ verdict, stage, score: Number(score.toFixed(3)), topic, reason, detail });

  // Fold any image description into the text we judge
  let described = imageDescription;
  if (!described && imageBytes && env.AI) {
    described = await describeImage(imageBytes, env);
  }
  if (described) detail.image = described;

  const combined = [
    text,
    described?.caption ? `Photo shows: ${described.caption}` : '',
    described?.labels?.length ? `Objects: ${described.labels.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  if (!combined.trim()) {
    return stamp('review', 'empty', 0, 'empty', 'Nothing to judge — sent for review.');
  }

  // Stage 0 — safety gate, independent of topic
  if (env.AI) {
    const safety = await safetyCheck(combined, env);
    detail.safety = safety;
    if (!safety.safe) {
      return stamp('block', 'safety', -10, 'unsafe',
        'This breaks the community safety rules.');
    }
  }

  // Stage 1 — lexicon
  const lex = lexiconScore(combined);
  detail.lexicon = { score: Number(lex.score.toFixed(2)), ...lex.hits };

  if (lex.score >= THRESHOLDS.lexiconAllow) {
    return stamp('allow', 'lexicon', lex.score, 'fitness',
      `Clear training content (${lex.hits.strong.slice(0, 3).join(', ')}).`);
  }
  if (lex.score <= THRESHOLDS.lexiconBlock) {
    return stamp('block', 'lexicon', lex.score, lex.hits.off[0] || 'off-topic',
      `This looks like ${lex.hits.off[0] || 'off-topic'} content, which isn't allowed here.`);
  }

  // Stage 2 — embeddings
  if (env.AI) {
    try {
      const emb = await embeddingScore(combined, env);
      detail.embedding = {
        fitness: Number(emb.fitness.toFixed(3)),
        offTopic: Number(emb.offTopic.toFixed(3)),
        margin: Number(emb.margin.toFixed(3)),
      };

      // Short, low-information text scores spuriously high against the fitness
      // centroid ("neet prep based neet" slipped through this way), so the
      // embedding stage may only auto-allow when there's a lexicon signal or
      // enough text to embed meaningfully. Everything else goes to the model.
      const letters = combined.replace(/[^\p{L}]/gu, '').length;
      const trustEmbedding = lex.hits.strong.length > 0 || lex.hits.weak.length > 0 || letters >= 40;

      if (emb.fitness >= THRESHOLDS.embedAllow && emb.margin > 0.05 && trustEmbedding) {
        return stamp('allow', 'embedding', emb.fitness, 'fitness',
          'Reads as training-related content.');
      }
      if (emb.fitness <= THRESHOLDS.embedBlock && emb.margin < 0) {
        return stamp('review', 'embedding', emb.fitness, 'off-topic',
          'Doesn\'t look training-related — queued for a human to check.');
      }
    } catch (err) {
      detail.embeddingError = err.message?.slice(0, 120);
    }
  }

  // Stage 3 — adjudicator decides the uncertain middle
  if (env.AI) {
    const verdict = await adjudicate(combined, env);
    detail.adjudicator = verdict;

    if (verdict) {
      if (verdict.onTopic) {
        return stamp('allow', 'adjudicator', verdict.confidence, verdict.topic, verdict.reason);
      }

      // Guard rails against confident-but-wrong blocks. If the post carries any
      // real training vocabulary, or is too short to judge, a human decides —
      // being wrongly blocked is far more damaging than a queued review.
      const hasFitnessSignal = lex.hits.strong.length > 0;
      const tooShortToJudge = combined.replace(/[^\p{L}]/gu, '').length < 20;
      const confident = verdict.confidence >= THRESHOLDS.blockConfidence;

      const verdictType = confident && !hasFitnessSignal && !tooShortToJudge ? 'block' : 'review';
      if (verdictType === 'review') {
        detail.downgraded = hasFitnessSignal
          ? `kept for review: mentions ${lex.hits.strong.slice(0, 2).join(', ')}`
          : tooShortToJudge ? 'kept for review: too short to judge confidently'
          : 'kept for review: model not confident';
      }
      return stamp(verdictType, 'adjudicator', verdict.confidence, verdict.topic,
        verdict.reason || 'This doesn\'t look like fitness content.');
    }
  }

  // Nothing could decide — never silently drop, always queue
  return stamp('review', 'fallback', lex.score, 'unclear',
    'Couldn\'t classify automatically — queued for review.');
};
