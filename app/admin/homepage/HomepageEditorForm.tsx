'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Config = {
  hero_image: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_subhead: string;
  hero_cta_text: string;
  hero_cta_link: string;
};

export default function HomepageEditorForm({
  initial, defaults
}: { initial: Config; defaults: Config }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function up<K extends keyof Config>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Save failed');
      }
      setMsg('Saved ✓  Your homepage updates within 30 seconds.');
      router.refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  function resetAll() {
    if (!confirm('Reset homepage to defaults?')) return;
    setForm(defaults);
  }

  return (
    <form onSubmit={save} className="mt-8 space-y-6">
      {/* Live preview */}
      <div className="card overflow-hidden">
        <div className="relative aspect-[2/1] sm:aspect-[2.4/1] bg-cream-100">
          {form.hero_image && (
            <Image
              src={form.hero_image}
              alt="Hero preview"
              fill sizes="(max-width: 768px) 100vw, 700px"
              className="object-cover"
            />
          )}
        </div>
        <div className="p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-blush-500">{form.hero_eyebrow}</p>
          <h2 className="font-display text-2xl text-ink-900 mt-2 line-clamp-2">{form.hero_headline}</h2>
          <p className="text-sm text-ink-700 mt-2 line-clamp-3">{form.hero_subhead}</p>
          <span className="btn-primary mt-3 inline-block text-sm">{form.hero_cta_text}</span>
        </div>
      </div>

      <Field
        label="Hero image URL *"
        hint="Right-click any image on the web → Copy image address. Use a high-quality 1400×1700 photo for best results."
      >
        <input
          type="url" required value={form.hero_image}
          onChange={(e) => up('hero_image', e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Eyebrow text" hint="Small uppercase line above the headline.">
        <input
          type="text" value={form.hero_eyebrow}
          onChange={(e) => up('hero_eyebrow', e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Headline" hint="The big bold statement.">
        <textarea
          rows={2} value={form.hero_headline}
          onChange={(e) => up('hero_headline', e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Subheadline" hint="Two-sentence supporting text below the headline.">
        <textarea
          rows={3} value={form.hero_subhead}
          onChange={(e) => up('hero_subhead', e.target.value)}
          className="input"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Call-to-action text" hint="The main button label.">
          <input
            type="text" value={form.hero_cta_text}
            onChange={(e) => up('hero_cta_text', e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Call-to-action link" hint="Where the button goes (relative URL).">
          <input
            type="text" value={form.hero_cta_link}
            onChange={(e) => up('hero_cta_link', e.target.value)}
            placeholder="/shop"
            className="input"
          />
        </Field>
      </div>

      {msg && (
        <div className={`card p-4 ${msg.startsWith('Saved') ? 'bg-sage-50 border border-sage-200 text-sage-500' : 'bg-blush-50 border border-blush-200 text-blush-500'}`}>
          <p className="text-sm font-medium">{msg}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={resetAll} className="btn-secondary">
          Reset to defaults
        </button>
      </div>

      <style jsx global>{`
        .input { width: 100%; border-radius: 0.75rem; padding: 0.65rem 0.9rem; background: white; border: 1px solid rgba(42,42,51,0.1); outline: none; font-size: 0.9rem; }
        .input:focus { box-shadow: 0 0 0 3px rgba(243,165,182,0.3); }
        textarea.input { border-radius: 1rem; }
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
