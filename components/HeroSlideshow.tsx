'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

const INTERVAL_MS = 6_000;
const SWIPE_THRESHOLD = 50;

/**
 * Auto-rotating hero background.
 *
 * The text overlay is passed in as children so the parent stays a server
 * component — only the image rotation needs to be client-side.
 */
export default function HeroSlideshow({
  images,
  alt,
  children,
}: {
  images: string[];
  alt: string;
  children: React.ReactNode;
}) {
  // De-duplicate and drop empties so a misconfigured admin image can't create
  // a "blank slide" that looks like a broken banner.
  const slides = Array.from(new Set(images.filter(Boolean)));

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => setIndex((next + slides.length) % slides.length),
    [slides.length]
  );

  // Auto-advance. Skipped entirely for one slide, when paused, or when the user
  // has asked their OS to reduce motion.
  useEffect(() => {
    if (slides.length < 2 || paused) return;

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  // Don't burn cycles rotating a banner nobody is looking at
  useEffect(() => {
    const onVisibility = () => setPaused(document.visibilityState !== 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD) go(index + (delta < 0 ? 1 : -1));
    touchStartX.current = null;
  }

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: '88vh' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      {slides.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-1000 ease-out motion-reduce:transition-none"
          style={{ opacity: i === index ? 1 : 0 }}
          aria-hidden={i !== index}
        >
          <Image
            src={src}
            alt={i === 0 ? alt : ''}
            fill
            // Only the first slide blocks rendering; the rest load lazily so the
            // banner doesn't cost four full-size images on first paint.
            priority={i === 0}
            loading={i === 0 ? undefined : 'lazy'}
            sizes="100vw"
            className="object-cover object-[center_30%] scale-105 motion-safe:animate-heroPan"
          />
        </div>
      ))}

      {/* Readability gradients — dark on the left where the text sits */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#FBF5EE] to-transparent" />

      {/* Overlay content */}
      <div className="relative z-10 flex items-center" style={{ minHeight: '88vh' }}>
        {children}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Show slide ${i + 1} of ${slides.length}`}
              aria-current={i === index}
              className="group p-2 -m-2"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === index
                    ? 'w-7 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50 group-hover:bg-white/80'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
