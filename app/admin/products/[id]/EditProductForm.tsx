'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductVariant } from '@/lib/types';
import { categories } from '@/lib/products';
import { normalizeImageUrl } from '@/lib/image-url';

type Props = { initial: Product; isCustom: boolean; visible: boolean };

export default function EditProductForm({ initial, isCustom, visible }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: initial.name,
    short_description: initial.shortDescription,
    description: initial.description,
    seo_description: initial.seoDescription || '',
    price: initial.price,
    compare_at_price: initial.compareAtPrice ?? '',
    image: initial.image,
    images: (initial.images || []).join(', '),
    category: initial.category,
    tags: (initial.tags || []).join(', '),
    cj_product_id: initial.cjProductId || '',
    cj_variant_id: initial.cjVariantId || '',
    in_stock: initial.inStock,
    best_seller: initial.bestSeller || false,
    visible
  });

  const [variants, setVariants] = useState<ProductVariant[]>(initial.variants || []);

  function up<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addVariant() {
    setVariants((v) => [
      ...v,
      { vid: `${initial.id}-v${v.length + 1}`, name: '', color: '', size: '', image: '' }
    ]);
  }
  function updateVariant(idx: number, key: keyof ProductVariant, value: any) {
    setVariants((v) => v.map((x, i) => (i === idx ? { ...x, [key]: value } : x)));
  }
  function removeVariant(idx: number) {
    setVariants((v) => v.filter((_, i) => i !== idx));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      // Build payload — only send fields that changed (best practice)
      const imageList = form.images
        .split(/[,\n]/)
        .map((s) => normalizeImageUrl(s))
        .filter(Boolean);

      const tagList = form.tags
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      // Clean variants — drop empty rows
      const cleanVariants = variants
        .filter((v) => v.name?.trim() || v.color?.trim() || v.size?.trim())
        .map((v) => ({
          ...v,
          name: v.name?.trim() || `${v.color || ''} ${v.size || ''}`.trim(),
          image: v.image ? normalizeImageUrl(v.image) : undefined
        }));

      const payload: any = {
        is_custom: isCustom,
        name: form.name.trim(),
        short_description: form.short_description.trim(),
        description: form.description.trim(),
        seo_description: form.seo_description.trim() || null,
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        image: normalizeImageUrl(form.image),
        images_json: imageList.length > 0 ? imageList : null,
        category: form.category,
        tags_json: tagList.length > 0 ? tagList : null,
        cj_product_id: form.cj_product_id.trim() || null,
        cj_variant_id: form.cj_variant_id.trim() || null,
        variants_json: cleanVariants.length > 0 ? cleanVariants : null,
        in_stock: form.in_stock,
        best_seller: form.best_seller,
        visible: form.visible
      };

      const res = await fetch(`/api/admin/products/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMsg('Saved ✓  Your store updates within 30 seconds.');
      router.refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!confirm(isCustom
      ? 'Delete this custom product permanently?'
      : 'Reset this product to its original code defaults? All admin edits will be lost.')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${initial.id}?is_custom=${isCustom}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      router.push('/admin/products');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-8 space-y-8">
      {/* Image preview */}
      <div className="card p-5">
        <p className="text-xs uppercase tracking-wider text-ink-500 mb-3">Live image preview</p>
        <div className="relative aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-cream-100">
          {form.image && (
            <Image
              src={normalizeImageUrl(form.image)}
              alt="Preview"
              fill sizes="300px"
              className="object-cover"
            />
          )}
        </div>
      </div>

      {/* Basic info */}
      <Section title="Basics">
        <Field label="Product name *">
          <input type="text" required value={form.name} onChange={(e) => up('name', e.target.value)} className="input" />
        </Field>
        <Field label="Tagline (one-liner shown on cards) *">
          <input type="text" required value={form.short_description} onChange={(e) => up('short_description', e.target.value)} className="input" />
        </Field>
        <Field label="Full description *" hint="Shown on the product page.">
          <textarea rows={6} required value={form.description} onChange={(e) => up('description', e.target.value)} className="input" />
        </Field>
        <Field label="SEO meta description" hint="Optional. 140–160 chars. Used in Google search results.">
          <textarea rows={2} maxLength={160} value={form.seo_description} onChange={(e) => up('seo_description', e.target.value)} className="input" />
          <span className="text-xs text-ink-500 mt-1 block">{form.seo_description.length}/160 chars</span>
        </Field>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Price (USD) *">
            <input type="number" step="0.01" min="0" required value={form.price} onChange={(e) => up('price', Number(e.target.value))} className="input" />
          </Field>
          <Field label="Compare-at price" hint="Optional. Shown crossed out for sale display.">
            <input type="number" step="0.01" min="0" value={form.compare_at_price} onChange={(e) => up('compare_at_price', e.target.value)} className="input" />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={(e) => up('category', e.target.value)} className="input">
              {categories.map((c) => (<option key={c.slug} value={c.slug}>{c.label}</option>))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Images */}
      <Section title="Images" hint="Supports Google Drive share links (set sharing to 'Anyone with link can view' first). Dropbox links also work.">
        <Field label="Main image URL *">
          <input type="text" required value={form.image} onChange={(e) => up('image', e.target.value)} className="input"
            placeholder="https://drive.google.com/file/d/..." />
        </Field>
        <Field label="Additional images (comma-separated)" hint="Each becomes a gallery thumbnail.">
          <textarea rows={3} value={form.images} onChange={(e) => up('images', e.target.value)} className="input"
            placeholder="https://drive.google.com/file/d/..., https://cf.cjdropshipping.com/..." />
        </Field>
      </Section>

      {/* Variants */}
      <Section title="Variants" hint="Colors, sizes, or any combination. Customers pick one before adding to cart. Leave empty if the product has no variants.">
        {variants.length === 0 ? (
          <p className="text-sm text-ink-500 italic">No variants yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-2 py-2 text-left">Name (shown to customer)</th>
                  <th className="px-2 py-2 text-left">Color</th>
                  <th className="px-2 py-2 text-left">Size</th>
                  <th className="px-2 py-2 text-left">Price override</th>
                  <th className="px-2 py-2 text-left">Image URL (for color swatch)</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1">
                      <input value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} className="input text-xs" placeholder="e.g. Pink / 3M" />
                    </td>
                    <td className="px-2 py-1">
                      <input value={v.color || ''} onChange={(e) => updateVariant(i, 'color', e.target.value)} className="input text-xs" placeholder="Pink" />
                    </td>
                    <td className="px-2 py-1">
                      <input value={v.size || ''} onChange={(e) => updateVariant(i, 'size', e.target.value)} className="input text-xs" placeholder="3M" />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" step="0.01" min="0" value={v.price ?? ''} onChange={(e) => updateVariant(i, 'price', e.target.value ? Number(e.target.value) : undefined)} className="input text-xs" placeholder="—" />
                    </td>
                    <td className="px-2 py-1">
                      <input value={v.image || ''} onChange={(e) => updateVariant(i, 'image', e.target.value)} className="input text-xs" placeholder="https://..." />
                    </td>
                    <td className="px-2 py-1">
                      <button type="button" onClick={() => removeVariant(i)} className="text-xs text-blush-500 hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button type="button" onClick={addVariant} className="mt-3 btn-secondary text-sm py-2 px-4">+ Add variant</button>
      </Section>

      {/* CJ + tags */}
      <Section title="CJ Dropshipping & SEO tags">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="CJ Product ID" hint="From the CJ URL after -p- and before .html">
            <input type="text" value={form.cj_product_id} onChange={(e) => up('cj_product_id', e.target.value)} className="input" />
          </Field>
          <Field label="CJ Variant ID (default)" hint="Used only when no variant is selected.">
            <input type="text" value={form.cj_variant_id} onChange={(e) => up('cj_variant_id', e.target.value)} className="input" />
          </Field>
        </div>
        <Field label="Tags (comma-separated)" hint="Used for search and SEO. e.g. 'baby carrier, ergonomic, hip seat'">
          <textarea rows={2} value={form.tags} onChange={(e) => up('tags', e.target.value)} className="input" />
        </Field>
      </Section>

      {/* Flags */}
      <Section title="Visibility & flags">
        <div className="flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.visible} onChange={(e) => up('visible', e.target.checked)} className="w-4 h-4 accent-blush-400" />
            <span className="text-sm text-ink-700">Visible on storefront</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.in_stock} onChange={(e) => up('in_stock', e.target.checked)} className="w-4 h-4 accent-blush-400" />
            <span className="text-sm text-ink-700">In stock</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.best_seller} onChange={(e) => up('best_seller', e.target.checked)} className="w-4 h-4 accent-blush-400" />
            <span className="text-sm text-ink-700">Best seller (homepage feature)</span>
          </label>
        </div>
      </Section>

      {msg && (
        <div className={`card p-4 ${msg.startsWith('Saved') ? 'bg-sage-50 border border-sage-200 text-sage-500' : 'bg-blush-50 border border-blush-200 text-blush-500'}`}>
          <p className="text-sm font-medium">{msg}</p>
        </div>
      )}

      <div className="flex justify-between flex-wrap gap-3">
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <Link href="/admin/products" className="btn-secondary">Cancel</Link>
        </div>
        <button type="button" onClick={reset}
          className={`px-4 py-2 rounded-full border ${isCustom ? 'bg-white border-blush-200 text-blush-500 hover:bg-blush-50' : 'bg-white border-ink-900/10 text-ink-700 hover:bg-cream-100'}`}>
          {isCustom ? 'Delete permanently' : 'Reset to code defaults'}
        </button>
      </div>

      <style jsx global>{`
        .input { width: 100%; border-radius: 0.75rem; padding: 0.55rem 0.85rem; background: white; border: 1px solid rgba(42,42,51,0.1); outline: none; font-size: 0.9rem; }
        .input:focus { box-shadow: 0 0 0 3px rgba(243,165,182,0.3); }
        textarea.input { border-radius: 1rem; }
      `}</style>
    </form>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-6">
      <legend className="font-display text-xl text-ink-900 px-2 -ml-2">{title}</legend>
      {hint && <p className="text-xs text-ink-500 mb-4">{hint}</p>}
      <div className="space-y-4">{children}</div>
    </fieldset>
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
