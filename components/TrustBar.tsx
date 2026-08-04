import type { ReactNode } from 'react';

/**
 * Trust / social-proof strip under the hero.
 *
 * Emoji were replaced with minimal line icons because emoji render completely
 * differently per OS — Apple's glyphs are glossy and colourful, Windows' are
 * flat, Android's differ again — so the strip looked inconsistent and off-brand
 * depending on the visitor's device. These are inline SVGs in the site palette,
 * so they look identical everywhere.
 */

const STROKE = {
  fill: 'none',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Star() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" stroke="currentColor" {...STROKE}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 16.9l-5.25 2.8 1-5.85L3.5 9.7l5.9-.9L12 3.5z" />
    </svg>
  );
}

function Family() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" stroke="currentColor" {...STROKE}>
      <path d="M12 20.5s-6.5-4-6.5-8.6a3.6 3.6 0 016.5-2.1 3.6 3.6 0 016.5 2.1c0 4.6-6.5 8.6-6.5 8.6z" />
    </svg>
  );
}

function Truck() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" stroke="currentColor" {...STROKE}>
      <path d="M3 7.5h10.5v8H3z" />
      <path d="M13.5 10.5H17l3 3v2h-6.5z" />
      <circle cx="7" cy="17" r="1.6" />
      <circle cx="17" cy="17" r="1.6" />
    </svg>
  );
}

function Return() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" stroke="currentColor" {...STROKE}>
      <path d="M4 9.5h11a4.5 4.5 0 010 9H8" />
      <path d="M7.5 6L4 9.5 7.5 13" />
    </svg>
  );
}

function Lock() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" stroke="currentColor" {...STROKE}>
      <rect x="5" y="10.5" width="14" height="9" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" />
    </svg>
  );
}

function Leaf() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" stroke="currentColor" {...STROKE}>
      <path d="M20 4c0 8-5 12-11 12a5 5 0 01-5-5C4 6 10 4 20 4z" />
      <path d="M4 20c3-6 7-9 12-11" />
    </svg>
  );
}

type Tone = 'blush' | 'sage' | 'ink';

const TONE: Record<Tone, string> = {
  blush: 'bg-blush-50 text-blush-500',
  sage: 'bg-sage-50 text-sage-600',
  ink: 'bg-cream-100 text-ink-700',
};

function Item({
  icon, stat, label, tone,
}: { icon: ReactNode; stat: string; label: string; tone: Tone }) {
  return (
    <li
      className="flex items-center gap-3 px-5 sm:px-6 py-4 shrink-0 snap-center
                 min-w-[13.5rem] sm:min-w-0 sm:flex-1 justify-center sm:justify-start"
    >
      <span
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${TONE[tone]}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-900 leading-tight whitespace-nowrap">{stat}</p>
        <p className="text-xs text-ink-500 whitespace-nowrap">{label}</p>
      </div>
    </li>
  );
}

export default function TrustBar({ shippingLabel }: { shippingLabel: string }) {
  return (
    <div className="bg-white border-y border-ink-900/5">
      {/*
        Horizontally scrollable with snap points on phones — six items can't fit
        on a 375px screen, and squashing them made the text unreadable. On
        desktop it becomes a normal evenly-spaced row.
      */}
      <ul
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none
                   sm:overflow-visible sm:justify-between
                   divide-x divide-ink-900/8"
      >
        <Item tone="blush" icon={<Star />}   stat="4.8 / 5"      label="Average rating" />
        <Item tone="blush" icon={<Family />} stat="10,000+"      label="Happy families" />
        <Item tone="sage"  icon={<Truck />}  stat="Free shipping" label={shippingLabel} />
        <Item tone="sage"  icon={<Return />} stat="14-day returns" label="No questions asked" />
        <Item tone="ink"   icon={<Lock />}   stat="Secure checkout" label="Stripe & PayPal" />
        <Item tone="sage"  icon={<Leaf />}   stat="Thoughtfully sourced" label="Mama-approved" />
      </ul>

      {/* Subtle hint that there's more to the right — phones only */}
      <p className="sm:hidden text-center text-[11px] text-ink-400 pb-2 -mt-1">
        swipe for more →
      </p>
    </div>
  );
}
