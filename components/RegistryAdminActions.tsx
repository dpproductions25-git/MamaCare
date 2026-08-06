'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistryAdminActions({
  registryId,
  ownerName,
  registryTitle = 'this registry',
  itemCount = 0,
  purchasedCount = 0,
}: {
  registryId: string;
  ownerName: string;
  registryTitle?: string;
  itemCount?: number;
  purchasedCount?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/registry/${registryId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleDelete() {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/registries/${registryId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Hide the card immediately. router.refresh() alone left the row on
        // screen until the server round-trip finished, which read as "nothing
        // happened" — and if the refresh was served from cache, permanently so.
        setDeleted(true);
        setConfirmDelete(false);
        router.refresh();
        return;
      }

      // Surface the server's diagnosis inline — this failure mode is confusing
      // enough that a generic message sends you hunting in the wrong place.
      const detail = data?.diagnosis
        ? ` ${data.diagnosis} (tried "${data.attemptedId}")`
        : '';
      setMsg(`${data.error || `Delete failed (${res.status}).`}${detail}`);
      setConfirmDelete(false);
    } catch (e: any) {
      setMsg(`Network error — ${e?.message || 'could not reach the server'}.`);
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      setMsg('PIN must be exactly 4 digits.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/registries/${registryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`✓ PIN reset to ${newPin} — share it with ${ownerName}.`);
        setShowPinForm(false);
        setNewPin('');
      } else {
        setMsg(data.error || 'Reset failed.');
      }
    } catch {
      setMsg('Network error.');
    } finally {
      setBusy(false);
    }
  }

  if (deleted) {
    return (
      <div className="mt-4 pt-4 border-t border-ink-900/6">
        <p className="text-sm text-sage-600 font-medium">
          ✓ Deleted &mdash; &ldquo;{registryTitle}&rdquo; and its {itemCount}{' '}
          {itemCount === 1 ? 'item' : 'items'} have been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-ink-900/6">
      <div className="flex flex-wrap gap-2">
        <a
          href={`/registry/${registryId}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs px-3 py-1.5 rounded-full border border-ink-900/12 text-ink-700 hover:border-blush-400 hover:text-blush-500 transition-colors"
        >
          View public page ↗
        </a>
        <button
          onClick={copyLink}
          className="text-xs px-3 py-1.5 rounded-full border border-ink-900/12 text-ink-700 hover:border-blush-400 hover:text-blush-500 transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy share link'}
        </button>
        <button
          onClick={() => { setShowPinForm((s) => !s); setMsg(''); }}
          className="text-xs px-3 py-1.5 rounded-full border border-ink-900/12 text-ink-700 hover:border-blush-400 hover:text-blush-500 transition-colors"
        >
          Reset PIN
        </button>

        {!confirmDelete && (
          <button
            onClick={() => { setConfirmDelete(true); setMsg(''); }}
            className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-300 transition-colors ml-auto"
          >
            Delete registry
          </button>
        )}
      </div>

      {confirmDelete && (
        <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm font-medium text-red-600">
            Permanently delete &ldquo;{registryTitle}&rdquo;?
          </p>
          <p className="text-xs text-ink-700 mt-1.5 leading-relaxed">
            This removes {ownerName}&apos;s registry and all {itemCount}{' '}
            {itemCount === 1 ? 'item' : 'items'}. Their share link will stop working
            for anyone they sent it to. This cannot be undone.
          </p>
          {purchasedCount > 0 && (
            <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Warning — {purchasedCount} {purchasedCount === 1 ? 'gift has' : 'gifts have'} already
              been purchased from this registry.
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDelete}
              disabled={busy}
              className="text-xs px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {busy ? 'Deleting…' : 'Yes, delete permanently'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={busy}
              className="text-xs px-4 py-2 rounded-full border border-ink-900/12 text-ink-700 hover:border-ink-900/25"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPinForm && (
        <form onSubmit={handleResetPin} className="mt-3 flex gap-2 items-center">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="New 4-digit PIN"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="px-4 py-2 text-sm rounded-full bg-white border border-ink-900/10 tracking-[0.3em] w-44"
          />
          <button
            type="submit"
            disabled={busy}
            className="text-xs px-4 py-2 rounded-full bg-blush-400 text-white hover:bg-blush-500 transition-colors disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Set PIN'}
          </button>
        </form>
      )}

      {msg && <p className="mt-2 text-xs text-ink-700">{msg}</p>}
    </div>
  );
}
