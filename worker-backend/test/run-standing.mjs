/**
 * Simulates a repeat off-topic poster and checks the escalation ladder:
 *   3 strikes → flagged, 5 → restricted (clean posts then queue instead of publishing).
 *   node test/run-standing.mjs [baseUrl] [userId]
 */
const base = process.argv[2] || 'http://localhost:8788';
const userId = process.argv[3] || 'strike-test-user';

const post = (body) => fetch(`${base}/api/community/posts`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, body }),
}).then(async r => ({ status: r.status, data: await r.json() }));

const standing = () => fetch(`${base}/api/community/standing/${userId}`).then(r => r.json());

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const SPAM = [
  'Join my team and be your own boss, passive income business opportunity, DM me to join',
  'Vote for change this November, our candidate will fix this country',
  'follow for follow, drop your handle below, sub4sub',
  'Hiring remote agents $35/hr no experience needed, link in bio to apply, dm me to join',
  'Selling my 2019 Honda Civic, 40k miles clean title, DM for price. real estate deals too',
];

// Reset so the ladder is measured from zero on every run
const adminKey = process.env.ADMIN_KEY || 'local-test-key';
await fetch(`${base}/api/community/moderation/users/${userId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
  body: JSON.stringify({ action: 'clear' }),
}).catch(() => {});

console.log(`simulating a repeat off-topic poster (${userId})\n`);
for (let i = 0; i < SPAM.length; i++) {
  const r = await post(SPAM[i]);
  const s = await standing();
  console.log(`  post ${i + 1}: ${r.status === 422 ? 'blocked' : r.data?.post?.status} ` +
              `→ strikes=${s.strikes} status=${s.status}`);
  if (i === 2) check('flagged after 3 strikes', s.status === 'flagged', `status=${s.status} strikes=${s.strikes}`);
  if (i === 4) check('restricted after 5 strikes', s.status === 'restricted', `status=${s.status} strikes=${s.strikes}`);
}

// A restricted user's clean post must be held for review, not published
const clean = await post('Squat PR today, 150kg for 3 reps. Deadlift next session.');
check('restricted user: clean post is held for review',
  clean.data?.post?.status === 'pending_review',
  `status=${clean.data?.post?.status}`);

const s2 = await standing();
check('standing message is shown to the user', !!s2.message, s2.message || '(none)');

// A different user is unaffected
const otherRes = await fetch(`${base}/api/community/posts`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'test-1', body: 'Bench 80kg 5x5 today, felt easy.' }),
}).then(r => r.json());
check('clean user is unaffected', otherRes?.post?.status === 'published',
  `status=${otherRes?.post?.status}`);

console.log(failures ? `\n${failures} check(s) failed` : '\nall standing checks passed');
process.exit(failures ? 1 : 0);
