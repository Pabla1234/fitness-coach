/**
 * Per-user moderation standing.
 *
 * The post cascade judges one post at a time; this layer remembers the person.
 * Someone whose first post is off-topic gets a normal rejection. Someone doing
 * it repeatedly earns escalating friction, so spammers can't just retry.
 *
 *   ok         → normal posting
 *   flagged    → still posts, but sees a warning; visible in the admin list
 *   restricted → every post is queued for review instead of publishing
 *
 * Strikes reset after a quiet period: one bad week shouldn't mark someone forever.
 */
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';

export const STANDING = {
  /** Strikes needed to be flagged / restricted */
  flagAt: 3,
  restrictAt: 5,
  /** Days of clean behaviour after which strikes reset to zero */
  quietDays: 30,
};

const nowSec = () => Math.floor(Date.now() / 1000);

const statusFor = (strikes) => {
  if (strikes >= STANDING.restrictAt) return 'restricted';
  if (strikes >= STANDING.flagAt) return 'flagged';
  return 'ok';
};

const blank = (userId) => ({
  userId, strikes: 0, blockedCount: 0, reviewCount: 0, publishedCount: 0,
  status: 'ok', lastViolationAt: null, lastTopic: null,
});

/** Current standing, with stale strikes already decayed away. */
export const getStanding = async (db, userId) => {
  const row = await db.select().from(schema.userModeration)
    .where(eq(schema.userModeration.userId, userId)).get();
  if (!row) return blank(userId);

  const quietFor = nowSec() - (row.lastViolationAt || 0);
  if (row.strikes > 0 && quietFor > STANDING.quietDays * 86400) {
    return { ...row, strikes: 0, status: 'ok', decayed: true };
  }
  return row;
};

/**
 * Fold one post verdict into the user's record.
 * @returns the standing after the update
 */
export const recordVerdict = async (db, userId, verdict, topic = null) => {
  const current = await getStanding(db, userId);

  // A decayed record is written back so the reset is durable, not just in-memory
  const strikeDelta = verdict === 'block' ? 1 : 0;
  const strikes = Math.max(0, (current.strikes || 0) + strikeDelta);

  const next = {
    userId,
    strikes,
    blockedCount:   (current.blockedCount   || 0) + (verdict === 'block'  ? 1 : 0),
    reviewCount:    (current.reviewCount    || 0) + (verdict === 'review' ? 1 : 0),
    publishedCount: (current.publishedCount || 0) + (verdict === 'allow'  ? 1 : 0),
    status: statusFor(strikes),
    lastViolationAt: verdict === 'block' ? nowSec() : (current.lastViolationAt || null),
    lastTopic: verdict === 'block' ? (topic || current.lastTopic) : current.lastTopic,
    updatedAt: nowSec(),
  };

  const exists = await db.select().from(schema.userModeration)
    .where(eq(schema.userModeration.userId, userId)).get();

  if (exists) {
    await db.update(schema.userModeration).set(next)
      .where(eq(schema.userModeration.userId, userId)).run();
  } else {
    await db.insert(schema.userModeration).values(next).run();
  }

  return next;
};

/** Wipe a user's strikes — used when a moderator clears them. */
export const clearStrikes = async (db, userId) => {
  const exists = await db.select().from(schema.userModeration)
    .where(eq(schema.userModeration.userId, userId)).get();
  if (!exists) return blank(userId);
  const next = { strikes: 0, status: 'ok', lastViolationAt: null, updatedAt: nowSec() };
  await db.update(schema.userModeration).set(next)
    .where(eq(schema.userModeration.userId, userId)).run();
  return { ...exists, ...next };
};

/** Force a user into restricted standing regardless of strike count. */
export const restrictUser = async (db, userId) => {
  const exists = await db.select().from(schema.userModeration)
    .where(eq(schema.userModeration.userId, userId)).get();
  const next = {
    userId,
    strikes: Math.max(STANDING.restrictAt, exists?.strikes || 0),
    status: 'restricted',
    lastViolationAt: nowSec(),
    updatedAt: nowSec(),
  };
  if (exists) {
    await db.update(schema.userModeration).set(next)
      .where(eq(schema.userModeration.userId, userId)).run();
  } else {
    await db.insert(schema.userModeration).values({ ...blank(userId), ...next }).run();
  }
  return next;
};

/** What the poster should be told about their own standing. */
export const standingMessage = (standing) => {
  if (!standing || standing.status === 'ok') return null;
  const left = Math.max(0, STANDING.restrictAt - (standing.strikes || 0));
  if (standing.status === 'restricted') {
    return 'Your posts are being reviewed before they appear, because several were off-topic. Post training content to get back to normal.';
  }
  return `${standing.strikes} of your posts were off-topic. ${left} more and your posts will need review before they appear.`;
};
