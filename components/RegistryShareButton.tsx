'use client';

import { useState } from 'react';

export default function RegistryShareButton({
  registryId,
  ownerName,
}: {
  registryId: string;
  ownerName: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/registry/${registryId}`;
    const title = `${ownerName}'s Baby Registry`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: `Help welcome ${ownerName}'s little one 🎀`, url });
        return;
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard blocked — nothing more we can do silently */
    }
  }

  return (
    <button
      onClick={share}
      className="px-6 py-3 rounded-full bg-blush-400 text-white text-sm font-medium hover:bg-blush-500 transition-colors inline-flex items-center gap-2"
    >
      {copied ? (
        '✓ Link copied!'
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" strokeLinecap="round" />
          </svg>
          Share this registry
        </>
      )}
    </button>
  );
}
