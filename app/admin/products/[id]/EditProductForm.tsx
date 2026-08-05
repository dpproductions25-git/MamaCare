'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductVariant } from '@/lib/types';
import { categories } from '@/lib/products';
import { normalizeImageUrl } from '@/lib/image-url';
import { colorSwatchStyle } from '@/lib/colors';
import CjImagePicker from '@/components/CjImagePicker';

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
    /**
     * Prices are held as STRINGS, not numbers.
     *
     * With a number, clearing the box gave Number('') === 0, which instantly
     * snapped the field back to "0" — so you could never delete the leading
     * zero, and typing "12." (mid-decimal) collapsed to "12". Keeping the raw
     * text and converting once on submit makes the field behave normally.
     */
    price: String(initial.price ?? ''),
    compare_at_price: initial.compareAtPrice != null ? String(initial.compareAtPrice) : '',
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
  // Drag-and-drop reorder state
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function up<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  /**
   * Accept only what can become a valid price as the user types: digits and a
   * single decimal point, max 2 decimal places. Deliberately permits "" and
   * "12." mid-typing — validation happens on submit, not on every keystroke.
   */
  function sanitizeMoney(raw: string): string {
    let s = raw.replace(/[^\d.]/g, '');
    const firstDot = s.indexOf('.');
    if (firstDot !== -1) {
      s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
    }
    const [whole, dec] = s.split('.');
    // Drop a leading zero as soon as a real digit follows ("05" → "5")
    const cleanWhole = whole.length > 1 ? whole.replace(/^0+(?=\d)/, '') : whole;
    return dec !== undefined ? `${cleanWhole}.${dec.slice(0, 2)}` : cleanWhole;
  }

  function addVariant() {
    setVariants((v) => [
      ...v,
      { vid: `${initial.id}-v${Date.now()}`, name: '', color: '', size: '', image: '' }
    ]);
  }
  function updateVariant(idx: number, key: keyof ProductVariant, value: any) {
    setVariants((v) => v.map((x, i) => (i === idx ? { ...x, [key]: value } : x)));
  }
  function removeVariant(idx: number) {
    setVariants((v) => v.filter((_, i) => i !== idx));
  }
  function duplicateVariant(idx: number) {
    setVariants((v) => {
      const copy = [...v];
      const dupe = { ...copy[idx], vid: `${initial.id}-v${Date.now()}` };
      copy.splice(idx + 1, 0, dupe);
      return copy;
    });
  }
  function moveVariant(from: number, to: number) {
    if (from === to) return;
    setVariants((v) => {
      const copy = [...v];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }
  function handleDragStart(idx: number) { dragIdx.current = idx; }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOver(idx);
  }
  function handleDrop(idx: number) {
    if (dragIdx.current !== null) moveVariant(dragIdx.current, idx);
    dragIdx.current = null;
    setDragOver(null);
  }
  function handleDragEnd() {
    dragIdx.current = null;
    setDragOver(null);
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
        .map((v) => {
          // priceText only exists to keep the input editable while typing —
          // strip it so it never gets persisted.
          const { priceText, ...rest } = v as ProductVariant & { priceText?: string };
          return {
            ...rest,
            name: v.name?.trim() || `${v.color || ''} ${v.size || ''}`.trim(),
            image: v.image ? normalizeImageUrl(v.image) : undefined,
          };
        });

      // Validate prices here rather than relying on the browser — the fields
      // are type="text" so there is no native number validation to lean on.
      const priceNum = Number(form.price);
      if (form.price.trim() === '' || !Number.isFinite(priceNum) || priceNum < 0) {
        throw new Error('Enter a valid price (for example 24.99).');
      }
      let compareNum: number | null = null;
      if (form.compare_at_price.trim() !== '') {
        compareNum = Number(form.compare_at_price);
        if (!Number.isFinite(compareNum) || compareNum < 0) {
          throw new Error('Compare-at price must be a valid amount, or left blank.');
        }
        if (compareNum <= priceNum) {
          throw new Error('Compare-at price must be higher than the price, or left blank.');
        }
      }

      const payload: any = {
        is_custom: isCustom,
        name: form.name.trim(),
        short_description: form.short_description.trim(),
        description: form.description.trim(),
        seo_description: form.seo_description.trim() || null,
        price: priceNum,
        compare_at_price: compareNum,
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
            <MoneyInput
              value={form.price}
              onChange={(v) => up('price', v)}
              onSanitize={sanitizeMoney}
              required
              placeholder="0.00"
            />
          </Field>
          <Field label="Compare-at price" hint="Optional. Shown crossed out for sale display.">
            <MoneyInput
              value={form.compare_at_price}
              onChange={(v) => up('compare_at_price', v)}
              onSanitize={sanitizeMoney}
              placeholder="Leave blank for none"
            />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={(e) => up('category', e.target.value)} className="input">
              {categories.map((c) => (<option key={c.slug} value={c.slug}>{c.label}</option>))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Images */}
      <Section title="Images" hint="Paste a CJ product URL to auto-fetch all photos. Or enter URLs manually below. Google Drive and Dropbox share links are supported.">
        {/* CJ image picker */}
        <CjImagePicker
          initialMain={form.image}
          initialGallery={form.images.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)}
          onApply={(main, gallery) => {
            up('image', main);
            up('images', gallery.join(', '));
          }}
          onApplyVariants={(imported) => {
            if (!confirm(`Replace your current ${variants.length} variant(s) with ${imported.length} imported from CJ?`)) return;
            setVariants(imported);
          }}
        />

        <div className="border-t border-ink-900/10 pt-4 mt-2">
          <p className="text-xs text-ink-500 mb-3">Or edit URLs manually:</p>
          <Field label="Main image URL *">
            <input type="text" required value={form.image} onChange={(e) => up('image', e.target.value)} className="input"
              placeholder="https://cf.cjdropshipping.com/... or Google Drive link" />
          </Field>
          <Field label="Additional images (comma-separated)" hint="Each becomes a gallery thumbnail on the product page.">
            <textarea rows={3} value={form.images} onChange={(e) => up('images', e.target.value)} className="input"
              placeholder="https://cf.cjdropshipping.com/.../photo2.jpg, https://..." />
          </Field>
        </div>
      </Section>

      {/* Variants */}
      <Section
        title="Variants"
        hint="Drag the ⠿ handle to reorder. Use ↑↓ arrows or drag to sort sizes (S → M → L → XL). Leave empty if the product has no variants."
      >
        <div className="space-y-2">
          {variants.length === 0 && (
            <p className="text-sm text-ink-500 italic py-2">No variants yet. Click below to add one.</p>
          )}
          {variants.map((v, i) => (
            <VariantCard
              key={v.vid || i}
              variant={v}
              index={i}
              total={variants.length}
              isDragOver={dragOver === i}
              onChange={(key, val) => updateVariant(i, key, val)}
              onRemove={() => removeVariant(i)}
              onDuplicate={() => duplicateVariant(i)}
              onMoveUp={() => moveVariant(i, i - 1)}
              onMoveDown={() => moveVariant(i, i + 1)}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button type="button" onClick={addVariant} className="btn-secondary text-sm py-2 px-4">
            + Add variant
          </button>
          {variants.length > 0 && (
            <p className="text-xs text-ink-400 self-center">
              {variants.length} variant{variants.length !== 1 ? 's' : ''} · drag ⠿ to reorder
            </p>
          )}
        </div>
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

// ── Variant card ─────────────────────────────────────────────────────────────
function VariantCard({
  variant,
  index,
  total,
  isDragOver,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  variant: ProductVariant;
  index: number;
  total: number;
  isDragOver: boolean;
  onChange: (key: keyof ProductVariant, value: any) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const swatch = colorSwatchStyle(variant.color || '');
  const hasImg = !!variant.image;
  const imgSrc = hasImg
    ? (() => { try { return normalizeImageUrl(variant.image!); } catch { return variant.image!; } })()
    : '';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`relative rounded-2xl border bg-white p-4 space-y-3 transition-all ${
        isDragOver
          ? 'border-blush-400 shadow-md ring-2 ring-blush-100'
          : 'border-ink-900/10'
      }`}
    >
      {/* Top bar: drag handle + order controls + action buttons */}
      <div className="flex items-center gap-2 mb-1">
        {/* Drag handle */}
        <span
          className="cursor-grab active:cursor-grabbing text-ink-300 hover:text-ink-500 select-none flex-shrink-0 px-1 text-lg leading-none"
          title="Drag to reorder"
        >
          ⠿
        </span>

        {/* Index badge */}
        <span className="text-xs text-ink-400 font-mono w-5 text-center flex-shrink-0">
          {index + 1}
        </span>

        {/* Up / Down arrows */}
        <div className="flex gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="Move up"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-cream-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label="Move down"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-cream-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs"
          >
            ↓
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Duplicate */}
        <button
          type="button"
          onClick={onDuplicate}
          aria-label="Duplicate variant"
          title="Duplicate this variant"
          className="text-xs px-2.5 py-1 rounded-lg border border-ink-900/10 text-ink-500 hover:text-ink-700 hover:bg-cream-100 transition-colors"
        >
          Copy
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove variant"
          title="Delete this variant"
          className="text-xs px-2.5 py-1 rounded-lg border border-blush-200 text-blush-400 hover:bg-blush-50 hover:text-blush-600 transition-colors"
        >
          Remove
        </button>
      </div>

      {/* Row 1: color swatch + color + size + price */}
      <div className="flex gap-3 items-start">
        {/* Live color swatch dot */}
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 mt-5 border-2 border-white shadow-sm"
          style={swatch}
          title={variant.color || 'no color set'}
        />

        <div className="flex-1 grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-ink-500 mb-1 block">Color</label>
            <input
              value={variant.color || ''}
              onChange={(e) => onChange('color', e.target.value)}
              className="input text-sm"
              placeholder="e.g. Pink"
            />
          </div>
          <div>
            <label className="text-xs text-ink-500 mb-1 block">Size</label>
            <input
              value={variant.size || ''}
              onChange={(e) => onChange('size', e.target.value)}
              className="input text-sm"
              placeholder="e.g. S, M, L, XL, 3M"
            />
          </div>
          <div>
            <label className="text-xs text-ink-500 mb-1 block">Price override</label>
            <div className="flex items-center w-full bg-white rounded-xl border border-ink-900/10 focus-within:ring-[3px] focus-within:ring-blush-300/30">
              <span className="pl-3 pr-1 text-ink-400 text-sm select-none">$</span>
              <input
                // text + inputMode, not type="number" — see MoneyInput below.
                type="text"
                inputMode="decimal"
                value={variant.priceText ?? (variant.price != null ? String(variant.price) : '')}
                onChange={(e) => {
                  const text = sanitizeVariantMoney(e.target.value);
                  onChange('priceText', text);
                  onChange('price', text === '' ? undefined : Number(text));
                }}
                className="flex-1 min-w-0 bg-transparent border-0 outline-none py-[0.55rem] pr-3 text-sm text-ink-900"
                placeholder="Base price"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: image thumbnail + URL */}
      <div className="flex gap-3 items-start pl-11">
        {hasImg && imgSrc && (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0 border border-ink-900/10">
            <Image src={imgSrc} alt="" fill sizes="56px" className="object-cover" />
          </div>
        )}
        <div className="flex-1">
          <label className="text-xs text-ink-500 mb-1 block">Variant image URL</label>
          <input
            value={variant.image || ''}
            onChange={(e) => onChange('image', e.target.value)}
            className="input text-sm"
            placeholder="https://... (used as color swatch preview)"
          />
        </div>
      </div>

      {/* Row 3: display name */}
      <div className="pl-11">
        <label className="text-xs text-ink-500 mb-1 block">
          Display name{' '}
          <span className="italic">(auto-fills from color + size if left blank)</span>
        </label>
        <input
          value={variant.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          className="input text-sm"
          placeholder={
            [variant.color, variant.size].filter(Boolean).join(' / ') || 'e.g. Pink / S'
          }
        />
      </div>
    </div>
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

/** Shared with the variant rows — same rules as sanitizeMoney above. */
function sanitizeVariantMoney(raw: string): string {
  let s = raw.replace(/[^\d.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }
  const [whole, dec] = s.split('.');
  const cleanWhole = whole.length > 1 ? whole.replace(/^0+(?=\d)/, '') : whole;
  return dec !== undefined ? `${cleanWhole}.${dec.slice(0, 2)}` : cleanWhole;
}

/**
 * Money field.
 *
 * Uses type="text" with inputMode="decimal" rather than type="number", because
 * number inputs cause real problems in an admin context:
 *   - the scroll wheel silently changes the price when scrolling the page
 *   - up/down arrow keys nudge the value unintentionally
 *   - browsers disagree on what a partial decimal ("12.") should do
 *   - locale keyboards may produce a comma, which type="number" discards
 * inputMode="decimal" still brings up the numeric keypad on phones.
 */
function MoneyInput({
  value,
  onChange,
  onSanitize,
  required,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSanitize: (raw: string) => string;
  required?: boolean;
  placeholder?: string;
}) {
  /*
   * The "$" sits in the flex row rather than absolutely over the field.
   * Overlaying it and adding pl-8 didn't work: `.input` is declared in a
   * styled-jsx global block whose `padding` shorthand loads after Tailwind and
   * overrode the utility, so the symbol sat on top of the digits.
   */
  return (
    <div className="flex items-center w-full bg-white rounded-xl border border-ink-900/10 focus-within:ring-[3px] focus-within:ring-blush-300/30 transition-shadow">
      <span className="pl-3.5 pr-1 text-ink-400 text-sm select-none">$</span>
      <input
        type="text"
        inputMode="decimal"
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(onSanitize(e.target.value))}
        // Tidy up to 2dp when leaving the field, but never while typing.
        onBlur={(e) => {
          const n = Number(e.target.value);
          if (e.target.value !== '' && Number.isFinite(n)) onChange(n.toFixed(2));
        }}
        onFocus={(e) => e.target.select()}
        className="flex-1 min-w-0 bg-transparent border-0 outline-none py-[0.55rem] pr-3.5 text-[0.9rem] text-ink-900"
      />
    </div>
  );
}
