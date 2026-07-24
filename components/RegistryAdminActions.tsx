'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistryAdminActions({
  registryId,
  ownerName,
}: {
  registryId: string;
  ownerName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        setMsg(data.error || 'Delete failed.');
      }
    } catch {
      setMsg('Network error.');
    } finally {
      setBusy(false);
      setConfirmDelete(false);
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

        {!confirmDelete ? (
          <button
            onClick={() => { setConfirmDelete(true); setMsg(''); }}
            className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-300 transition-colors ml-auto"
          >
            Delete
          </button>
        ) : (
          <div className="flex gap-2 ml-auto items-center">
            <span className="text-xs text-ink-700">Delete permanently?</span>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {busy ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs px-3 py-1.5 rounded-full border border-ink-900/12 text-ink-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

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
