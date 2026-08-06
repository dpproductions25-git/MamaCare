'use client';

import { useRegistry } from '@/lib/registry-store';

/**
 * Opens the MamaCare registry drawer from the footer.
 *
 * Replaces a link to babylist.com — an external competitor — which sent
 * customers off-site to build their registry somewhere else entirely. This
 * keeps them here, on the registry feature this store actually owns.
 *
 * A button rather than a Link because the registry is a drawer, not a page;
 * there is no standalone URL to point at until a registry exists.
 */
export default function RegistryFooterLink() {
  const open = useRegistry((s) => s.open);
  const registryId = useRegistry((s) => s.registryId);

  return (
    <button
      type="button"
      onClick={open}
      className="hover:text-blush-500 inline-flex items-center gap-1.5 text-left"
    >
      🍼 {registryId ? 'My baby registry' : 'Create a baby registry'}
    </button>
  );
}
