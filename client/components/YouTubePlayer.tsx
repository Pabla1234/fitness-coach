'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2, X } from 'lucide-react';

// ─── IFrame Player API loader (single shared instance) ────────────────────────
let apiPromise: Promise<any> | null = null;

function loadYouTubeAPI(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('ssr'));
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous();
      resolve(w.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onerror = () => reject(new Error('YouTube API blocked'));
    document.head.appendChild(tag);
    // Adblockers can swallow the script silently — don't hang forever
    setTimeout(() => reject(new Error('YouTube API timeout')), 8000);
  });

  return apiPromise;
}

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

// ─── Thumbnail with graceful fallback ─────────────────────────────────────────
// hqdefault 404s for deleted videos; mqdefault returns a grey placeholder, so we
// try the good one first and fall through to a card if the video is gone.
export const YouTubeThumb = ({ id, alt, className = '' }: { id: string; alt: string; className?: string }) => {
  const [step, setStep] = useState(0);
  const sources = [
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
  ];

  if (step >= sources.length) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 ${className}`}>
        <AlertTriangle size={22} />
        <span className="text-[10px] font-semibold">Preview unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={sources[step]}
      alt={alt}
      loading="lazy"
      onError={() => setStep(s => s + 1)}
      className={className}
    />
  );
};

// ─── Player ───────────────────────────────────────────────────────────────────
interface Props {
  id: string;
  title?: string;
  /** Start playing immediately (muted autoplay is the only kind browsers allow) */
  autoplay?: boolean;
  muted?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * Embeds a YouTube video and, crucially, *notices when the embed fails* —
 * deleted videos, region blocks and "playback on other websites disabled"
 * all surface as a clear fallback with a link out instead of a dead black box.
 */
export default function YouTubePlayer({ id, title, autoplay = true, muted = false, onClose, className = '' }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reason, setReason] = useState('This video can’t be played here');

  useEffect(() => {
    let cancelled = false;
    let readyTimer: ReturnType<typeof setTimeout>;

    setState('loading');

    loadYouTubeAPI()
      .then(YT => {
        if (cancelled || !hostRef.current) return;

        playerRef.current = new YT.Player(hostRef.current, {
          videoId: id,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            mute: muted ? 1 : 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              if (cancelled) return;
              clearTimeout(readyTimer);
              setState('ready');
              if (autoplay) {
                try { muted ? e.target.mute() : e.target.unMute(); e.target.playVideo(); } catch { /* ignore */ }
              }
            },
            onError: (e: any) => {
              if (cancelled) return;
              clearTimeout(readyTimer);
              const codes: Record<number, string> = {
                2:   'This video link is invalid',
                5:   'This video can’t play in this browser',
                100: 'This video was removed or made private',
                101: 'The owner doesn’t allow it to play on other sites',
                150: 'The owner doesn’t allow it to play on other sites',
              };
              setReason(codes[e?.data] || 'This video can’t be played here');
              setState('error');
            },
          },
        });

        // If the player never reports ready, treat it as a failure rather than
        // leaving the user staring at a black rectangle.
        readyTimer = setTimeout(() => {
          if (!cancelled) setState(s => (s === 'loading' ? 'error' : s));
        }, 9000);
      })
      .catch(() => {
        if (!cancelled) {
          setReason('The YouTube player could not load (an extension may be blocking it)');
          setState('error');
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(readyTimer);
      try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, [id, autoplay, muted]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* The API replaces this node with the iframe */}
      {state !== 'error' && <div ref={hostRef} className="w-full h-full" />}

      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-none">
          <Loader2 size={22} className="animate-spin text-white/70" />
        </div>
      )}

      {state === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center bg-slate-900">
          <AlertTriangle size={24} className="text-amber-400" />
          <p className="text-xs font-semibold text-slate-200 leading-snug max-w-[90%]">{reason}</p>
          <a
            href={watchUrl(id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
          >
            <ExternalLink size={12} /> Watch on YouTube
          </a>
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close video"
          className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
        >
          <X size={14} />
        </button>
      )}

      {title && <span className="sr-only">{title}</span>}
    </div>
  );
}
