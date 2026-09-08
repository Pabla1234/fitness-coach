'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, Flag, Heart, Image as ImageIcon, Loader2,
  MessageCircle, Send, ShieldAlert, ShieldCheck, Sparkles, X,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Author { id: string; name: string }
interface Moderation { stage: string | null; score: number | null; topic: string | null; reason: string | null }
interface Standing { status: 'ok' | 'flagged' | 'restricted'; strikes: number; message: string | null }
export interface Post {
  id: string;
  parentId: string | null;
  body: string;
  imageKey: string | null;
  imageCaption: string | null;
  status: 'published' | 'pending_review' | 'blocked' | 'removed';
  moderation: Moderation;
  likeCount: number;
  replyCount: number;
  createdAt: number;
  author: Author;
  likedByMe: boolean;
}

const timeAgo = (unixSeconds: number) => {
  const secs = Math.max(1, Math.floor(Date.now() / 1000) - (unixSeconds || 0));
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
};

const mediaUrl = (key: string) => `${API}/api/community/media/${encodeURIComponent(key)}`;

const initials = (name: string) =>
  name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'A';

// ─── Composer ─────────────────────────────────────────────────────────────────
const Composer = ({
  userId, parentId = null, onPosted, onStanding, placeholder = 'Share a session, a PR, or ask the community…', compact = false,
}: {
  userId: string;
  parentId?: string | null;
  onPosted: (post: Post) => void;
  onStanding?: (s: Standing) => void;
  placeholder?: string;
  compact?: boolean;
}) => {
  const [body, setBody]           = useState('');
  const [posting, setPosting]     = useState(false);
  const [blocked, setBlocked]     = useState<{ reason: string; topic: string } | null>(null);
  const [hint, setHint]           = useState<string | null>(null);
  const [imageKey, setImageKey]   = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaOff, setMediaOff]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Warn before posting if the text reads as off-topic — cheaper than a rejection
  useEffect(() => {
    setBlocked(null);
    const text = body.trim();
    if (text.length < 25) { setHint(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/community/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        setHint(data.verdict === 'block' ? data.reason : null);
      } catch { setHint(null); }
    }, 900);
    return () => clearTimeout(t);
  }, [body]);

  const pickImage = async (file: File) => {
    setUploading(true);
    setBlocked(null);
    try {
      const res = await fetch(`${API}/api/community/upload`, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (res.status === 503) { setMediaOff(true); return; }
      const data = await res.json();
      if (data.key) {
        setImageKey(data.key);
        setImagePreview(URL.createObjectURL(file));
      }
    } catch { setMediaOff(true); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if ((!body.trim() && !imageKey) || posting) return;
    setPosting(true);
    setBlocked(null);
    try {
      const res = await fetch(`${API}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, body, imageKey, parentId }),
      });
      const data = await res.json();
      if (data.standing) onStanding?.(data.standing);
      if (res.status === 422 && data.blocked) {
        setBlocked({ reason: data.reason, topic: data.topic });
        return;
      }
      if (data.post) {
        onPosted(data.post);
        setBody('');
        setImageKey(null);
        setImagePreview(null);
        setHint(null);
      }
    } catch {
      setBlocked({ reason: 'Could not reach the server. Try again.', topic: 'network' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0d1117] ${compact ? 'p-3' : 'p-4'}`}>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
        rows={compact ? 2 : 3}
        placeholder={placeholder}
        className="w-full bg-transparent resize-none outline-none text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
      />

      {imagePreview && (
        <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <img src={imagePreview} alt="" className="w-full max-h-72 object-cover" />
          <button
            onClick={() => { setImageKey(null); setImagePreview(null); }}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {hint && !blocked && (
        <div className="mt-2 flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400">
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
          <span>This may be rejected: {hint}</span>
        </div>
      )}

      {blocked && (
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-2.5">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-xs font-bold text-red-700 dark:text-red-300">Not posted — this community is fitness only</p>
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">{blocked.reason}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-2">
          {!mediaOff && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) pickImage(f); }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                title="Add a photo"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
              </button>
            </>
          )}
          {mediaOff && (
            <span className="text-[10px] text-slate-400">Photos aren’t enabled yet — text posts only</span>
          )}
        </div>

        <button
          onClick={submit}
          disabled={posting || (!body.trim() && !imageKey)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition-transform active:scale-95"
        >
          {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          {parentId ? 'Reply' : 'Post'}
        </button>
      </div>
    </div>
  );
};

// ─── Post card ────────────────────────────────────────────────────────────────
const PostCard = ({
  post, userId, onOpen, onChanged,
}: { post: Post; userId: string; onOpen?: () => void; onChanged?: (p: Post) => void }) => {
  const [liked, setLiked]   = useState(post.likedByMe);
  const [likes, setLikes]   = useState(post.likeCount);
  const [reported, setReported] = useState(false);

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const optimistic = !liked;
    setLiked(optimistic);
    setLikes(l => l + (optimistic ? 1 : -1));
    try {
      const res = await fetch(`${API}/api/community/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setLiked(data.liked);
      setLikes(data.likeCount);
      onChanged?.({ ...post, likedByMe: data.liked, likeCount: data.likeCount });
    } catch {
      setLiked(!optimistic);
      setLikes(l => l + (optimistic ? -1 : 1));
    }
  };

  const report = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setReported(true);
    try {
      await fetch(`${API}/api/community/posts/${post.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason: 'not fitness related' }),
      });
    } catch { /* the optimistic state is fine */ }
  };

  const mine = post.author.id === userId;

  return (
    <div
      onClick={onOpen}
      className={`rounded-2xl border bg-white dark:bg-[#0d1117] p-4 transition-colors ${
        onOpen ? 'cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-700/50' : ''
      } ${
        post.status === 'pending_review'
          ? 'border-amber-300 dark:border-amber-800/60'
          : 'border-slate-100 dark:border-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center text-[11px] font-bold">
          {initials(post.author.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{post.author.name}</p>
          <p className="text-[11px] text-slate-400">{timeAgo(post.createdAt)} ago</p>
        </div>
        {post.moderation?.topic && post.status === 'published' && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
            <ShieldCheck size={10} /> {post.moderation.topic}
          </span>
        )}
      </div>

      {post.status === 'pending_review' && (
        <div className="mb-2.5 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-2.5">
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-amber-500" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            {mine ? 'Under review — only you can see this until a moderator checks it.' : 'Queued for review.'}
            {post.moderation?.reason ? ` ${post.moderation.reason}` : ''}
          </p>
        </div>
      )}

      {post.body && (
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{post.body}</p>
      )}

      {post.imageKey && (
        <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
          <img src={mediaUrl(post.imageKey)} alt={post.imageCaption || ''} loading="lazy" className="w-full max-h-[420px] object-cover" />
        </div>
      )}

      <div className="flex items-center gap-4 mt-3">
        <button
          onClick={toggleLike}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
          }`}
        >
          <Heart size={15} fill={liked ? 'currentColor' : 'none'} /> {likes}
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <MessageCircle size={15} /> {post.replyCount}
        </span>
        {!mine && (
          <button
            onClick={report}
            disabled={reported}
            className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 dark:text-slate-600 hover:text-amber-500 disabled:text-amber-500 transition-colors"
            title="Report as not fitness related"
          >
            <Flag size={12} /> {reported ? 'Reported' : 'Report'}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Thread detail ────────────────────────────────────────────────────────────
const ThreadView = ({ postId, userId, onBack }: { postId: string; userId: string; onBack: () => void }) => {
  const [post, setPost]       = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/community/posts/${postId}?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      setPost(data.post || null);
      setReplies(data.replies || []);
    } catch { /* leave the empty state */ }
    finally { setLoading(false); }
  }, [postId, userId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4 pb-10">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft size={14} /> Back to feed
      </button>

      {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>}

      {post && <PostCard post={post} userId={userId} onChanged={p => setPost(p)} />}

      {post && (
        <Composer
          userId={userId}
          parentId={post.id}
          compact
          placeholder="Add to the thread…"
          onPosted={reply => setReplies(r => [...r, reply])}
        />
      )}

      <div className="space-y-3 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
        {replies.map(r => <PostCard key={r.id} post={r} userId={userId} />)}
        {!loading && replies.length === 0 && (
          <p className="text-xs text-slate-400 py-3">No replies yet — start the conversation.</p>
        )}
      </div>
    </div>
  );
};

// ─── Feed ─────────────────────────────────────────────────────────────────────
const CommunityView = ({ userId }: { userId: string }) => {
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [openId, setOpenId]     = useState<string | null>(null);
  const [standing, setStanding] = useState<Standing | null>(null);

  useEffect(() => {
    fetch(`${API}/api/community/standing/${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(d => setStanding(d?.status ? d : null))
      .catch(() => {});
  }, [userId]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/community/feed?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch { /* empty state covers it */ }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (openId) return <ThreadView postId={openId} userId={userId} onBack={() => { setOpenId(null); load(); }} />;

  return (
    <div className="space-y-5 pb-10">
      <div className="animate-enter">
        <h1 className="text-2xl font-extrabold">
          <span className="text-slate-900 dark:hidden">Community</span>
          <span className="hidden dark:inline animate-text-gradient">Community</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-500 text-sm mt-1 flex items-center gap-1.5">
          <Sparkles size={13} className="text-indigo-400" />
          Fitness only — every post is checked before it reaches the feed
        </p>
      </div>

      {standing && standing.status !== 'ok' && standing.message && (
        <div className={`flex items-start gap-2.5 rounded-2xl border p-3 ${
          standing.status === 'restricted'
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
        }`}>
          <ShieldAlert size={16} className={`mt-0.5 flex-shrink-0 ${
            standing.status === 'restricted' ? 'text-red-500' : 'text-amber-500'
          }`} />
          <div>
            <p className={`text-xs font-bold ${
              standing.status === 'restricted'
                ? 'text-red-700 dark:text-red-300'
                : 'text-amber-700 dark:text-amber-300'
            }`}>
              {standing.status === 'restricted' ? 'Your posts are being reviewed' : 'Warning'}
            </p>
            <p className={`text-[11px] mt-0.5 ${
              standing.status === 'restricted'
                ? 'text-red-600 dark:text-red-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>{standing.message}</p>
          </div>
        </div>
      )}

      <Composer
        userId={userId}
        onStanding={setStanding}
        onPosted={p => setPosts(prev => [p, ...prev])}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-500" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-600">
          <MessageCircle size={34} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No posts yet</p>
          <p className="text-xs mt-1">Be the first — log today’s session.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <PostCard
              key={p.id}
              post={p}
              userId={userId}
              onOpen={() => setOpenId(p.id)}
              onChanged={updated => setPosts(prev => prev.map(x => (x.id === updated.id ? updated : x)))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityView;
