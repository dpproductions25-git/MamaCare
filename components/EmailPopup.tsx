'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// Bump this key any time you want to re-show the popup to everyone
const STORAGE_KEY = 'mc_popup_v3';
const DELAY_MS = 5_000;

// Never interrupt someone who is paying, or the shop owner in admin
const SUPPRESSED_PREFIXES = ['/checkout', '/admin', '/cart'];

/**
 * Storage that degrades instead of failing.
 *
 * Safari Private Browsing, locked-down iOS webviews, and strict privacy
 * settings can make localStorage throw on read OR write. The previous version
 * returned early when that happened, so the popup never appeared for those
 * users at all. Now we fall back to an in-memory flag: the popup still works,
 * it just won't be remembered across a reload.
 */
let memoryDismissed = false;

function wasDismissed(): boolean {
  if (memoryDismissed) return true;
  try {
    return !!window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

function markDismissed() {
  memoryDismissed = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* storage unavailable — in-memory flag still covers this session */
  }
}

export default function EmailPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<Element | null>(null);

  const suppressed = SUPPRESSED_PREFIXES.some((p) => pathname?.startsWith(p));

  // ── Trigger ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (suppressed || wasDismissed()) return;

    let timer: ReturnType<typeof setTimeout>;
    const show = () => setVisible(true);

    // Only count time while the tab is actually being looked at, so someone who
    // opens the site in a background tab doesn't come back to a stale popup.
    const start = () => { timer = setTimeout(show, DELAY_MS); };
    const stop = () => clearTimeout(timer);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);

    // NOTE: no exit-intent trigger. Firing on mouseleave meant the popup
    // appeared every time the cursor went near the browser chrome, tabs, or a
    // second monitor — which reads as broken rather than persuasive. The
    // 5-second timer is the only trigger.

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [suppressed]);

  const dismiss = useCallback(() => {
    markDismissed();
    setVisible(false);
  }, []);

  // ── While open: scroll lock, Escape, focus ────────────────────────────────
  useEffect(() => {
    if (!visible) return;

    lastFocused.current = document.activeElement;

    // Compensate for the scrollbar so desktop layouts don't jump when it hides
    const scrollBarW = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollBarW > 0) document.body.style.paddingRight = `${scrollBarW}px`;

    // Focus the input, but not on touch devices — that would pop the on-screen
    // keyboard open unprompted and cover the offer.
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    const finePointer =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: fine)').matches;
    if (finePointer) {
      focusTimer = setTimeout(() => inputRef.current?.focus(), 60);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        dismiss();
        return;
      }
      // Keep Tab inside the dialog while it's open
      if (e.key === 'Tab' && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
      document.removeEventListener('keydown', onKeyDown);
      if (focusTimer) clearTimeout(focusTimer);
      // Restore focus to wherever the user was
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    };
  }, [visible, dismiss]);

  // Close if the user navigates somewhere the popup shouldn't appear
  useEffect(() => {
    if (suppressed && visible) setVisible(false);
  }, [suppressed, visible]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;

    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('done');
        markDismissed();
        setTimeout(() => setVisible(false), 3200);
      } else {
        setStatus('error');
        setErrorMsg(data?.error || 'Something went wrong — please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error — please check your connection.');
    }
  }

  if (!visible || suppressed) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/50 px-4 py-6 mc-popup-backdrop"
      onClick={dismiss}
      style={{
        // Respect notches / home indicators on iOS
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mc-popup-title"
        aria-describedby="mc-popup-desc"
        className="relative w-full max-w-md bg-cream-50 rounded-3xl shadow-card overflow-y-auto max-h-full mc-popup-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-cream-100 hover:bg-cream-200 active:bg-cream-200 text-ink-500 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <div className="h-1.5 bg-blush-400" />

        <div className="px-6 sm:px-8 py-8 sm:py-9 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-blush-50 flex items-center justify-center mb-5 text-2xl select-none" aria-hidden="true">
            🌸
          </div>

          <h2 id="mc-popup-title" className="font-display text-2xl sm:text-3xl text-ink-900 leading-tight">
            Welcome to MamaCare
          </h2>
          <p id="mc-popup-desc" className="text-ink-600 mt-3 text-sm leading-relaxed">
            Join the MamaCare circle and get{' '}
            <strong className="text-blush-500">10% off your first order</strong>
            {' '}— plus mama-approved picks and new arrivals straight to your inbox.
          </p>

          {status === 'done' ? (
            <div className="mt-8 py-5 px-6 rounded-2xl bg-sage-50 border border-sage-200" role="status" aria-live="polite">
              <p className="font-display text-xl text-sage-600">You&apos;re in! 🎉</p>
              <p className="text-sm text-ink-600 mt-1 break-words">
                Your 10% code is on its way to <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3" noValidate={false}>
              <label htmlFor="mc-popup-email" className="sr-only">Email address</label>
              <input
                ref={inputRef}
                id="mc-popup-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                // Mobile keyboard + autofill hints — without these iOS
                // auto-capitalises and autocorrects email addresses.
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="send"
                disabled={status === 'sending'}
                aria-invalid={status === 'error'}
                className="w-full rounded-full px-5 py-3.5 bg-white border border-ink-900/10 focus:outline-none focus:ring-2 focus:ring-blush-300 text-base sm:text-sm disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="btn-primary w-full disabled:opacity-60"
              >
                {status === 'sending' ? 'Subscribing…' : 'Get 10% off my first order'}
              </button>
              {status === 'error' && (
                <p className="text-xs text-blush-500 mt-1" role="alert">{errorMsg}</p>
              )}
            </form>
          )}

          <button
            type="button"
            onClick={dismiss}
            className="mt-5 text-xs text-ink-400 hover:text-ink-600 underline underline-offset-2"
          >
            No thanks, I&apos;ll pay full price
          </button>
        </div>
      </div>
    </div>
  );
}
