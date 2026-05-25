'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContent, PageId } from '@/lib/page-content';

export default function PageEditorForm({
  slug, initial, defaults
}: { slug: PageId; initial: PageContent; defaults: PageContent }) {
  const router = useRouter();
  const [form, setForm] = useState<PageContent>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function up<K extends keyof PageContent>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMsg('Saved ✓  Page updates live within 30 seconds.');
      router.refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function resetAll() {
    if (!confirm('Reset this whole page back to the original code defaults? All admin edits will be lost.')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${slug}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Reset failed');
      setForm(defaults);
      router.refresh();
      setMsg('Reset to defaults ✓');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-8 space-y-6">
      {/* Live preview */}
      <div className="card overflow-hidden">
        <div className="bg-cream-100 px-5 py-2 text-xs uppercase tracking-wider text-ink-700">
          Live preview
        </div>
        <div className="p-6">
          <h1 className="font-display text-3xl text-ink-900">{form.heading}</h1>
          <div
            className="prose-content mt-4 text-ink-700"
            dangerouslySetInnerHTML={{ __html: form.body }}
          />
        </div>
      </div>

      <Field label="Browser tab title (also Google search title)" hint="50–60 characters recommended.">
        <input
          type="text" value={form.title}
          onChange={(e) => up('title', e.target.value)}
          maxLength={120} className="input"
        />
        <span className="text-xs text-ink-500 mt-1 block">{form.title.length} characters</span>
      </Field>

      <Field label="SEO meta description" hint="140–160 characters. Shown in Google search results.">
        <textarea
          rows={2} value={form.meta}
          onChange={(e) => up('meta', e.target.value)}
          maxLength={200} className="input"
        />
        <span className="text-xs text-ink-500 mt-1 block">{form.meta.length} characters</span>
      </Field>

      <Field label="Page heading (the H1 at top)">
        <input type="text" value={form.heading} onChange={(e) => up('heading', e.target.value)} className="input" />
      </Field>

      <Field
        label="Body content (HTML)"
        hint="Allowed tags: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <a>, <strong>, <em>, <br>"
      >
        <textarea
          rows={20} value={form.body}
          onChange={(e) => up('body', e.target.value)}
          className="input font-mono text-xs"
        />
      </Field>

      {msg && (
        <div className={`card p-4 ${msg.startsWith('Saved') || msg.startsWith('Reset')
          ? 'bg-sage-50 border border-sage-200 text-sage-500'
          : 'bg-blush-50 border border-blush-200 text-blush-500'}`}>
          <p className="text-sm font-medium">{msg}</p>
        </div>
      )}

      <div className="flex justify-between flex-wrap gap-3">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={resetAll}
          className="px-4 py-2 rounded-full bg-white border border-ink-900/10 text-ink-700 hover:bg-cream-100">
          Reset to code defaults
        </button>
      </div>

      <style jsx global>{`
        .input { width: 100%; border-radius: 0.75rem; padding: 0.55rem 0.85rem; background: white; border: 1px solid rgba(42,42,51,0.1); outline: none; font-size: 0.9rem; }
        .input:focus { box-shadow: 0 0 0 3px rgba(243,165,182,0.3); }
        textarea.input { border-radius: 1rem; }
        .prose-content h2 { font-family: Georgia, serif; font-size: 1.5rem; color: #2A2A33; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .prose-content h3 { font-family: Georgia, serif; font-size: 1.25rem; color: #2A2A33; margin-top: 1rem; margin-bottom: 0.4rem; }
        .prose-content p { margin: 0.75rem 0; line-height: 1.7; }
        .prose-content ul, .prose-content ol { margin: 0.75rem 0 0.75rem 1.25rem; }
        .prose-content li { margin: 0.3rem 0; line-height: 1.6; }
        .prose-content a { color: #D86A82; text-decoration: underline; }
        .prose-content strong { color: #2A2A33; font-weight: 600; }
        .prose-content .muted { color: #7A7A87; font-size: 0.875rem; }
        .prose-content .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; list-style: none; margin-left: 0; }
        .prose-content .stats li { background: white; border-radius: 1rem; padding: 1rem; box-shadow: 0 4px 12px -8px rgba(0,0,0,0.08); }
        .prose-content .stats li strong { display: block; font-size: 1.1rem; }
      `}</style>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-900">{label}</span>
      {hint && <span className="block text-xs text-ink-500 mb-1">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}
