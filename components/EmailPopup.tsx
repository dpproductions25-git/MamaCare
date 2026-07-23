'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'mc_popup_dismissed';
const DELAY_MS = 8_000; // show after 8 s of browsing

export default function EmailPopup() {
  // mounted guards against any SSR/hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    setMounted(true);
    // Already dismissed — never show again
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Time-on-page trigger
    const timer = setTimeout(() => setVisible(true), DELAY_MS);

    // Exit-intent trigger: cursor moves toward browser chrome (top of viewport)
    function onLeave(e: MouseEvent) {
      if (e.clientY <= 0 && !localStorage.getItem(STORAGE_KEY)) {
        clearTimeout(timer);
        setVisible(true);
      }
    }
    document.addEventListener('mouseleave', onLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email }),
      });
      if (res.ok) {
        setStatus('done');
        localStorage.setItem(STORAGE_KEY, '1');
        setTimeout(() => setVisible(false), 2800);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  // Don't render anything until client has hydrated, or if not visible
  if (!mounted || !visible) return null;

  return (
    <>
      {/* ── Backdrop — z-50, covers the page ── */}
      <div
        role="presentation"
        aria-hidden="true"
        className="fixed inset-0 bg-ink-900/50 z-50"
        onClick={dismiss}
      />

      {/* ── Modal — z-[60] so it sits above the backdrop and receives all clicks ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Get 10% off your first order"
        className="fixed z-[60] inset-x-4 bottom-6 sm:inset-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-md bg-cream-50 rounded-4xl shadow-card overflow-hidden animate-fadeUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close ✕ */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-100 text-ink-500 transition-colors z-10"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        {/* Blush accent stripe */}
        <div className="h-1.5 bg-gradient-to-r from-blush-300 via-blush-400 to-blush-300" />

        <div className="p-8 sm:p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-blush-50 flex items-center justify-center mb-5 text-2xl select-none">
            🌸
          </div>

          <h2 className="font-display text-3xl text-ink-900 leading-tight">
            Welcome to MamaCare
          </h2>
          <p className="text-ink-600 mt-3 leading-relaxed text-sm">
            Join the MamaCare circle and get{' '}
            <strong className="text-blush-500">10% off your first order</strong>
            {' '}— plus mama-approved picks, new arrivals, and pregnancy tips straight to your inbox.
          </p>

          {status === 'done' ? (
            <div className="mt-8 py-5 px-6 rounded-2xl bg-sage-50 border border-sage-200">
              <p className="font-display text-xl text-sage-600">You&apos;re in! 🎉</p>
              <p className="text-sm text-ink-600 mt-1">
                Your 10% code is on its way to <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full rounded-full px-5 py-3.5 bg-white border border-ink-900/10 focus:outline-none focus:ring-2 focus:ring-blush-300 text-sm"
                disabled={status === 'sending'}
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="btn-primary w-full disabled:opacity-60"
              >
                {status === 'sending' ? 'Subscribing…' : 'Get 10% off my first order'}
              </button>
              {status === 'error' && (
                <p className="text-xs text-blush-500 mt-1">Something went wrong — please try again.</p>
              )}
            </form>
          )}

          <button
            type="button"
            onClick={dismiss}
            className="mt-4 text-xs text-ink-400 hover:text-ink-600 underline underline-offset-2"
          >
            No thanks, I&apos;ll pay full price
          </button>
        </div>
      </div>
    </>
  );
}
