/**
 * Runs the labelled cases through a running worker's /api/community/check.
 *   node test/run-moderation.mjs [baseUrl]
 * Fitness cases must not be blocked; off-topic cases must not be allowed.
 * "edge-*" cases are reported but don't fail the run — they're judgement calls.
 */
import { readFileSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:8788';
const cases = JSON.parse(readFileSync(new URL('./moderation-cases.json', import.meta.url)));

const pad = (s, n) => String(s).padEnd(n).slice(0, n);
let failures = 0;
const counts = {};

for (const c of cases) {
  const expected = c.off ? 'off-topic' : (c.label || 'fitness');
  let result;
  try {
    const res = await fetch(`${base}/api/community/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: c.text }),
    });
    result = await res.json();
  } catch (err) {
    console.error('request failed:', err.message);
    process.exit(1);
  }

  const v = result.verdict;
  counts[v] = (counts[v] || 0) + 1;

  let ok = true;
  if (expected === 'fitness') ok = v === 'allow';
  else if (expected === 'off-topic') ok = v === 'block' || v === 'review';

  const strict = expected === 'fitness' || expected === 'off-topic';
  if (strict && !ok) failures++;

  const mark = !strict ? '·' : ok ? 'ok  ' : 'FAIL';
  console.log(
    `${mark} ${pad(expected, 12)} → ${pad(v, 7)} [${pad(result.stage, 11)}] ` +
    `${pad(result.topic, 18)} | ${pad(c.text, 58)}`,
  );
  if (strict && !ok) console.log(`      reason: ${result.reason}`);
}

console.log('\nverdicts:', JSON.stringify(counts));
console.log(failures ? `\n${failures} strict case(s) failed` : '\nall strict cases passed');
process.exit(failures ? 1 : 0);
