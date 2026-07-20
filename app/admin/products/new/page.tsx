'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { categories } from '@/lib/products';
import CjImagePicker from '@/components/CjImagePicker';
import type { ProductVariant } from '@/lib/types';

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    seo_description: '',
    price: '',
    compare_at_price: '',
    image: '',
    extra_images: '',
    category: 'gear',
    cj_url: '',
    cj_variant_id: '',
    in_stock: true,
    best_seller: false
  });

  function up<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!form.name.trim()) return setErr('Name is required.');
    if (!form.price || isNaN(Number(form.price))) return setErr('Valid price required.');
    if (!form.image.trim()) return setErr('Image URL required.');
    if (!form.short_description.trim()) return setErr('Short description / tagline required.');

    setSaving(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          variants_json: variants.length > 0 ? variants : null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      router.push('/admin/products');
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  }

  return (
    <section className="container-page py-10 max-w-3xl">
      <nav className="text-sm text-ink-500 mb-4">
        <Link href="/admin" className="hover:text-blush-500">Admin</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/products" className="hover:text-blush-500">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-900">New product</span>
      </nav>

      <h1 className="font-display text-4xl text-ink-900">Add a new product</h1>
      <p className="text-ink-500 mt-2">
        Paste the CJ URL and fill in the basics. The product goes live on your store immediately.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        {/* ── CJ image picker ───────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <div>
            <p className="font-display text-xl text-ink-900 mb-1">Photos</p>
            <p className="text-xs text-ink-500">
              Paste the CJ product URL to pull all images automatically — then pick and order the ones you want.
            </p>
          </div>
          <CjImagePicker
            onApply={(main, gallery) => {
              up('image', main);
              up('extra_images', gallery.join(', '));
            }}
            onApplyVariants={(imported) => {
              setVariants(imported);
            }}
          />
          {variants.length > 0 && (
            <p className="text-xs text-sage-600 font-medium">
              ✓ {variants.length} variant{variants.length !== 1 ? 's' : ''} imported from CJ
            </p>
          )}
          <div className="border-t border-ink-900/10 pt-4">
            <p className="text-xs text-ink-500 mb-3">Or enter URLs manually:</p>
            <Field label="Main image URL *" hint="Right-click a CJ photo → Copy image address. Or Google Drive / Dropbox link.">
              <input
                type="url" required value={form.image}
                onChange={(e) => up('image', e.target.value)}
                placeholder="https://cf.cjdropshipping.com/.../photo.jpg"
                className="input"
              />
            </Field>
            <div className="mt-3">
              <Field label="Additional image URLs" hint="Separate multiple URLs with commas.">
                <textarea
                  rows={2} value={form.extra_images}
                  onChange={(e) => up('extra_images', e.target.value)}
                  placeholder="https://cf.cjdropshipping.com/.../photo2.jpg, https://.../photo3.jpg"
                  className="input"
                />
              </Field>
            </div>
          </div>
        </div>

        <Field label="CJ Dropshipping URL (optional)" hint="We'll extract the product ID for fulfillment.">
          <input
            type="url" value={form.cj_url}
            onChange={(e) => up('cj_url', e.target.value)}
            placeholder="https://www.cjdropshipping.com/product/..."
            className="input"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Product name *" hint="Shown on cards and the product page.">
            <input
              type="text" required value={form.name}
              onChange={(e) => up('name', e.target.value)}
              placeholder="e.g. Cozy Quilted Sleep Sack"
              className="input"
            />
          </Field>
          <Field label="URL slug" hint="Auto-generated from name if empty. Lowercase, hyphens.">
            <input
              type="text" value={form.slug}
              onChange={(e) => up('slug', e.target.value)}
              placeholder="cozy-quilted-sleep-sack"
              className="input"
            />
          </Field>
        </div>

        <Field label="Short description / tagline *" hint="One-line summary shown on cards.">
          <input
            type="text" required value={form.short_description}
            onChange={(e) => up('short_description', e.target.value)}
            placeholder="Cloud-soft sleep sack for newborns."
            className="input"
          />
        </Field>

        <Field label="Full description *" hint="Shown on the product page.">
          <textarea
            required rows={5} value={form.description}
            onChange={(e) => up('description', e.target.value)}
            placeholder="A breathable quilted wrap-style sleeping bag..."
            className="input"
          />
        </Field>

        <Field
          label="SEO description"
          hint="Optional. The meta description shown in Google search results. 140–160 characters recommended. If left blank, we auto-generate one from the tagline + description."
        >
          <textarea
            rows={2} value={form.seo_description}
            onChange={(e) => up('seo_description', e.target.value)}
            placeholder="Cozy quilted baby sleep sack designed for newborns. Breathable, hip-healthy, machine washable. Free U.S. shipping over $50."
            maxLength={160}
            className="input"
          />
          <span className="text-xs text-ink-500 mt-1 block">
            {form.seo_description.length}/160 characters
          </span>
        </Field>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Price (USD) *">
            <input
              type="number" step="0.01" min="0" required value={form.price}
              onChange={(e) => up('price', e.target.value)}
              placeholder="29.99" className="input"
            />
          </Field>
          <Field label="Compare-at price" hint="Optional. Crosses out for sale display.">
            <input
              type="number" step="0.01" min="0" value={form.compare_at_price}
              onChange={(e) => up('compare_at_price', e.target.value)}
              placeholder="39.99" className="input"
            />
          </Field>
          <Field label="Category *">
            <select
              required value={form.category}
              onChange={(e) => up('category', e.target.value)}
              className="input"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="CJ Variant ID (optional)" hint="The specific SKU. Without it, you'll manually create the CJ order.">
          <input
            type="text" value={form.cj_variant_id}
            onChange={(e) => up('cj_variant_id', e.target.value)}
            placeholder="e.g. ABCDEF12345"
            className="input"
          />
        </Field>

        <div className="flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.in_stock}
              onChange={(e) => up('in_stock', e.target.checked)}
              className="w-4 h-4 accent-blush-400" />
            <span className="text-sm text-ink-700">In stock</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.best_seller}
              onChange={(e) => up('best_seller', e.target.checked)}
              className="w-4 h-4 accent-blush-400" />
            <span className="text-sm text-ink-700">Mark as best seller (homepage feature)</span>
          </label>
        </div>

        {err && (
          <div className="card p-4 bg-blush-50 border border-blush-200">
            <p className="text-sm text-blush-500 font-medium">{err}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Creating…' : 'Create product'}
          </button>
          <Link href="/admin/products" className="btn-secondary">Cancel</Link>
        </div>
      </form>

      <style jsx global>{`
        .input { width: 100%; border-radius: 0.75rem; padding: 0.65rem 0.9rem; background: white; border: 1px solid rgba(42,42,51,0.1); outline: none; font-size: 0.9rem; }
        .input:focus { box-shadow: 0 0 0 3px rgba(243,165,182,0.3); }
        textarea.input { border-radius: 1rem; }
      `}</style>
    </section>
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
