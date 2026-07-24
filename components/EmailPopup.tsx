'use client';

import { useState, useEffect } from 'react';

// Bump this key any time you want to reset dismissal for all users
const STORAGE_KEY = 'mc_popup_v2';
const DELAY_MS = 8_000;

export default function EmailPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    // Already dismissed — skip
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return; // localStorage blocked (private mode edge case)
    }

    const show = () => setVisible(true);

    // Time-on-page trigger
    const timer = setTimeout(show, DELAY_MS);

    // Exit-intent: cursor moves toward browser chrome
    function onLeave(e: MouseEvent) {
      if (e.clientY <= 0) {
        clearTimeout(timer);
        show();
      }
    }
    document.addEventListener('mouseleave', onLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
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
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
        setTimeout(() => setVisible(false), 2800);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (!visible) return null;

  return (
    /* Backdrop — clicking outside the card dismisses */
    <div
      role="presentation"
      aria-hidden="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50"
      onClick={dismiss}
    >
      {/* Card — stopPropagation so clicks inside don't hit the backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Get 10% off your first order"
        className="relative w-full max-w-md bg-cream-50 rounded-3xl shadow-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close ✕ */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-cream-100 hover:bg-cream-200 text-ink-500 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        {/* Blush accent stripe */}
        <div className="h-1.5 bg-gradient-to-r from-blush-300 via-blush-400 to-blush-300" />

        <div className="px-8 py-9 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-blush-50 flex items-center justify-center mb-5 text-2xl select-none">
            🌸
          </div>

          <h2 className="font-display text-3xl text-ink-900 leading-tight">
            Welcome to MamaCare
          </h2>
          <p className="text-ink-600 mt-3 text-sm leading-relaxed">
            Join the MamaCare circle and get{' '}
            <strong className="text-blush-500">10% off your first order</strong>
            {' '}— plus mama-approved picks and new arrivals straight to your inbox.
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
            className="mt-5 text-xs text-ink-400 hover:text-ink-600 underline underline-offset-2"
          >
            No thanks, I&apos;ll pay full price
          </button>
        </div>
      </div>
    </div>
  );
}
