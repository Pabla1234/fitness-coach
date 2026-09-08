/**
 * End-to-end check of the community API against a running worker.
 *   node test/run-community-e2e.mjs [baseUrl] [userId]
 */
const base = process.argv[2] || 'http://localhost:8788';
const userId = process.argv[3] || 'test-1';

const post = (path, body) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async r => ({ status: r.status, data: await r.json() }));

const get = (path) => fetch(base + path).then(r => r.json());

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// 1. a genuine training post publishes
const root = await post('/api/community/posts', {
  userId,
  body: 'Week 6 of PPL. Bench went 60kg to 72.5kg. Slow but it is moving.',
});
check('fitness post publishes', root.data?.post?.status === 'published',
  `status=${root.data?.post?.status} stage=${root.data?.moderation?.stage}`);
const rootId = root.data?.post?.id;

// 2. spam is refused at post time
const spam = await post('/api/community/posts', {
  userId,
  body: 'BITCOIN 300% returns guaranteed, DM me for signals, limited stock, link in bio to buy',
});
check('crypto spam refused', spam.status === 422 && spam.data?.blocked === true,
  `status=${spam.status} reason=${spam.data?.reason}`);

// 3. replies attach to the thread
const reply = await post('/api/community/posts', {
  userId, parentId: rootId, body: 'Nice progress. What rep scheme are you running on bench?',
});
check('reply attaches to parent', reply.data?.post?.parentId === rootId,
  `parentId=${reply.data?.post?.parentId}`);

// 4. replyCount goes up on the root
const thread = await get(`/api/community/posts/${rootId}?userId=${userId}`);
check('thread returns root + replies', thread?.post?.id === rootId && thread?.replies?.length >= 1,
  `replies=${thread?.replies?.length}`);
check('replyCount incremented', thread?.post?.replyCount >= 1,
  `replyCount=${thread?.post?.replyCount}`);

// 5. like toggles both ways
const like1 = await post(`/api/community/posts/${rootId}/like`, { userId });
check('like registers', like1.data?.liked === true && like1.data?.likeCount === 1,
  JSON.stringify(like1.data));
const like2 = await post(`/api/community/posts/${rootId}/like`, { userId });
check('like un-toggles', like2.data?.liked === false && like2.data?.likeCount === 0,
  JSON.stringify(like2.data));

// 6. replies must not appear as their own feed items
const feed = await get(`/api/community/feed?userId=${userId}`);
const replyInFeed = (feed.posts || []).some(p => p.id === reply.data?.post?.id);
check('replies stay out of the feed', !replyInFeed);
check('root post appears in feed', (feed.posts || []).some(p => p.id === rootId));

// 7. reporting is recorded
const report = await post(`/api/community/posts/${rootId}/report`, { userId, reason: 'test' });
check('report accepted', report.data?.ok === true, JSON.stringify(report.data));

// 8. moderation is not reachable without the admin key
const queueRes = await fetch(base + '/api/community/moderation/queue');
check('moderation queue refuses anonymous access', queueRes.status === 401 || queueRes.status === 503,
  `status=${queueRes.status}`);

const removeRes = await fetch(`${base}/api/community/moderation/${rootId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'remove' }),
});
check('moderation actions refuse anonymous access', removeRes.status === 401 || removeRes.status === 503,
  `status=${removeRes.status}`);

const stillThere = await get(`/api/community/posts/${rootId}?userId=${userId}`);
check('post survived the unauthorised remove attempt', stillThere?.post?.status === 'published',
  `status=${stillThere?.post?.status}`);

console.log(failures ? `\n${failures} check(s) failed` : '\nall community checks passed');
process.exit(failures ? 1 : 0);
