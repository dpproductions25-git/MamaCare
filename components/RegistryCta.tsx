'use client';

import { useRegistry } from '@/lib/registry-store';

/**
 * Primary registry call-to-action for content pages (gift guide, etc.).
 *
 * The registry lives in a drawer rather than at its own URL until one exists,
 * so this opens the drawer instead of navigating.
 */
export default function RegistryCta({
  className = 'btn-primary px-7 py-3.5',
}: {
  className?: string;
}) {
  const open = useRegistry((s) => s.open);
  const registryId = useRegistry((s) => s.registryId);

  return (
    <button type="button" onClick={open} className={className}>
      🍼 {registryId ? 'Open my registry' : 'Create my registry'}
    </button>
  );
}
