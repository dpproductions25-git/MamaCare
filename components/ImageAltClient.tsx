'use client';

import { useState, useEffect, useCallback } from 'react';

type ImageRow = {
  imageUrl: string;
  productId: string;
  productName: string;
  category: string;
  isMain: boolean;
  currentAlt: string | null;
};

type Stats = {
  aiEnabled: boolean;
  total: number;
  described: number;
  missing: number;
  coveragePct: number;
};

async function post(body: any) {
  const res = await fetch('/api/admin/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function ImageAltClient() {
  const [rows, setRows] = useState<ImageRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState<'missing' | 'all'>('missing');

  /** Edited/suggested text keyed by image url, awaiting approval. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [health, setHealth] = useState<any[] | null>(null);
  /** Per-image generation errors, shown so the cause is visible. */
  const [failures, setFailures] = useState<{ imageUrl: string; error: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/images');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load');
      setRows(data.images || []);
      setStats(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = rows.filter((r) => (filter === 'missing' ? !r.currentAlt : true));

  function toggle(url: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  }

  function selectAllVisible() {
    // 25 is the server-side cap per generate call
    setSelected(new Set(visible.slice(0, 25).map((r) => r.imageUrl)));
  }

  /**
   * Generate for an explicit list, so the button never depends on the user
   * having ticked checkboxes first. Nothing selected simply means "the first 25
   * that need it".
   */
  async function generate(urls?: string[]) {
    const targets = urls?.length ? urls : [...selected];
    const list = targets.length
      ? targets
      : visible.filter((r) => !r.currentAlt).slice(0, 25).map((r) => r.imageUrl);

    if (!list.length) { setErr('There are no images left needing a description.'); return; }

    setBusy(true); setMsg(''); setErr(''); setFailures([]);
    try {
      const data = await post({ action: 'generate', imageUrls: list });

      const next = { ...drafts };
      for (const r of data.results) if (r.altText) next[r.imageUrl] = r.altText;
      setDrafts(next);

      // Surface the actual per-image reasons. External image hosts sometimes
      // block OpenAI from fetching the file, and a bare count of failures gives
      // no way to tell that from a bad API key.
      const failed = (data.results || []).filter((r: any) => r.error);
      setFailures(failed);

      if (data.generated === 0) {
        setErr(
          failed.length
            ? `None could be generated. First error: ${failed[0].error}`
            : 'No suggestions were returned.'
        );
      } else {
        setMsg(
          `Generated ${data.generated} suggestion${data.generated === 1 ? '' : 's'}` +
          (failed.length ? ` · ${failed.length} failed (see below)` : '') +
          ' — edit if needed, then Save.'
        );
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveApproved() {
    const entries = Object.entries(drafts)
      .filter(([, text]) => text.trim())
      .map(([imageUrl, altText]) => {
        const row = rows.find((r) => r.imageUrl === imageUrl);
        return { imageUrl, altText, productId: row?.productId ?? null, source: 'ai' as const };
      });

    if (!entries.length) { setErr('Nothing to save.'); return; }
    setBusy(true); setMsg(''); setErr('');
    try {
      const data = await post({ action: 'save', entries });
      setMsg(`✓ Saved ${data.saved} description${data.saved === 1 ? '' : 's'}.`);
      setDrafts({});
      setSelected(new Set());
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function runHealth() {
    setBusy(true); setMsg(''); setErr(''); setHealth(null);
    try {
      const data = await post({ action: 'health' });
      setHealth(data.problems);
      setMsg(
        data.problemCount === 0
          ? `✓ Checked ${data.checked} images — all reachable and good resolution.`
          : `Checked ${data.checked} images — ${data.problemCount} need attention.`
      );
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const draftCount = Object.values(drafts).filter((v) => v.trim()).length;

  return (
    <div className="mt-8">
      {/* Coverage */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Images" value={stats.total} />
          <Stat label="Described" value={stats.described} />
          <Stat label="Missing" value={stats.missing} />
          <Stat label="Coverage" value={`${stats.coveragePct}%`} />
        </div>
      )}

      {stats && !stats.aiEnabled && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <strong>AI generation is off.</strong> Add{' '}
          <code className="bg-white/60 px-1.5 py-0.5 rounded">OPENAI_API_KEY</code> in
          Vercel → Settings → Environment Variables and redeploy. You can still write
          alt text by hand below.
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mt-6">
        <div className="flex rounded-full border border-ink-900/12 overflow-hidden">
          <button
            onClick={() => setFilter('missing')}
            className={`px-4 py-2 text-sm ${filter === 'missing' ? 'bg-blush-400 text-white' : 'text-ink-700'}`}
          >
            Missing ({rows.filter((r) => !r.currentAlt).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm ${filter === 'all' ? 'bg-blush-400 text-white' : 'text-ink-700'}`}
          >
            All ({rows.length})
          </button>
        </div>

        {/* Never disabled for lack of a selection — with nothing ticked it
            simply works on the next 25 that need descriptions. */}
        <button
          onClick={() => generate()}
          disabled={busy || !stats?.aiEnabled}
          className="btn-primary text-sm px-5 py-2 disabled:opacity-50"
        >
          {busy
            ? 'Generating…'
            : selected.size
              ? `Generate for ${selected.size} selected`
              : 'Generate next 25 missing'}
        </button>
        <button
          onClick={selectAllVisible}
          className="text-sm px-4 py-2 rounded-full border border-ink-900/12 text-ink-700 hover:border-blush-400"
        >
          Select first 25
        </button>
        {draftCount > 0 && (
          <button onClick={saveApproved} disabled={busy} className="text-sm px-5 py-2 rounded-full bg-sage-500 text-white hover:bg-sage-600 disabled:opacity-50">
            Save {draftCount} approved
          </button>
        )}
        <button onClick={runHealth} disabled={busy} className="text-sm px-4 py-2 rounded-full border border-ink-900/12 text-ink-700 hover:border-blush-400 ml-auto">
          Scan for broken images
        </button>
      </div>

      {msg && <p className="text-sm text-sage-600 mt-3">{msg}</p>}
      {err && <p className="text-sm text-red-500 mt-3">{err}</p>}

      {failures.length > 0 && (
        <div className="card p-5 mt-4 border border-red-200 bg-red-50/40">
          <h3 className="font-display text-lg text-ink-900 mb-1">
            {failures.length} image{failures.length === 1 ? '' : 's'} couldn&apos;t be described
          </h3>
          <p className="text-xs text-ink-500 mb-3">
            Most often the image host blocks OpenAI from downloading the file, or the URL is
            dead. Run &ldquo;Scan for broken images&rdquo; to check, and write those few by hand.
          </p>
          <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
            {failures.map((f) => (
              <li key={f.imageUrl}>
                <p className="text-red-600">{f.error}</p>
                <p className="text-[11px] text-ink-400 break-anywhere">{f.imageUrl}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Health results */}
      {health && health.length > 0 && (
        <div className="card p-5 mt-5 border border-amber-200">
          <h3 className="font-display text-lg text-ink-900 mb-3">Images needing attention</h3>
          <ul className="space-y-2 text-sm">
            {health.map((h) => (
              <li key={h.imageUrl} className="flex items-start gap-3">
                <span className="text-amber-600">⚠</span>
                <div className="min-w-0">
                  <p className="text-ink-900">{h.issue}</p>
                  <p className="text-xs text-ink-400 break-anywhere">{h.imageUrl}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Image list */}
      {loading ? (
        <p className="text-ink-500 mt-8">Loading images…</p>
      ) : (
        <div className="mt-6 space-y-3">
          {visible.length === 0 && (
            <div className="card p-10 text-center text-ink-500">
              {filter === 'missing' ? 'Every image has alt text 🎉' : 'No images found.'}
            </div>
          )}

          {visible.map((row) => {
            const draft = drafts[row.imageUrl] ?? '';
            const isSelected = selected.has(row.imageUrl);
            return (
              <div key={row.imageUrl} className={`card p-4 flex gap-4 ${isSelected ? 'ring-2 ring-blush-300' : ''}`}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(row.imageUrl)}
                  className="mt-1 w-4 h-4 accent-blush-400 flex-shrink-0"
                />

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.imageUrl}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover bg-cream-100 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {row.productName}
                    {row.isMain && (
                      <span className="ml-2 text-[11px] bg-blush-50 text-blush-600 px-2 py-0.5 rounded-full">main</span>
                    )}
                  </p>

                  {row.currentAlt && !draft && (
                    <p className="text-xs text-sage-600 mt-1">Current: {row.currentAlt}</p>
                  )}

                  <input
                    value={draft || row.currentAlt || ''}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [row.imageUrl]: e.target.value }))
                    }
                    placeholder="Describe this image…"
                    maxLength={125}
                    className="w-full mt-2 px-3 py-2 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
                  />
                  <p className="text-[11px] text-ink-400 mt-1">
                    {(draft || row.currentAlt || '').length}/125 · screen readers cut off around here
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-ink-500 uppercase tracking-wider">{label}</p>
      <p className="font-display text-3xl text-ink-900 mt-2">{value}</p>
    </div>
  );
}
