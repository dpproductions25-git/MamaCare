'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Coupon = {
  code: string;
  type: 'percent' | 'fixed' | 'free-shipping';
  value: number | null;
  description: string;
  active: boolean;
  expires_at: string | null;
  min_subtotal: number | null;
  max_redemptions: number | null;
  times_redeemed: number;
  single_use: boolean;
  issued_to: string | null;
  created_at: string;
};

type Shipping = { freeThreshold: number; flatRate: number };

async function post(body: any) {
  const res = await fetch('/api/admin/marketing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

export default function MarketingClient({
  initialShipping,
  initialCoupons,
}: {
  initialShipping: Shipping;
  initialCoupons: Coupon[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'shipping' | 'codes' | 'generate'>('shipping');

  return (
    <div className="mt-8">
      <div className="flex gap-2 border-b border-ink-900/8 mb-6 flex-wrap">
        <Tab id="shipping" active={tab} set={setTab}>Shipping</Tab>
        <Tab id="codes" active={tab} set={setTab}>Discount codes</Tab>
        <Tab id="generate" active={tab} set={setTab}>Generate codes</Tab>
      </div>

      {tab === 'shipping' && <ShippingPanel initial={initialShipping} />}
      {tab === 'codes' && <CodesPanel initial={initialCoupons} onChange={() => router.refresh()} />}
      {tab === 'generate' && <GeneratePanel onDone={() => router.refresh()} />}
    </div>
  );
}

function Tab({ id, active, set, children }: any) {
  const on = active === id;
  return (
    <button
      onClick={() => set(id)}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        on ? 'border-blush-400 text-blush-500' : 'border-transparent text-ink-500 hover:text-ink-900'
      }`}
    >
      {children}
    </button>
  );
}

function Msg({ text, error }: { text: string; error?: boolean }) {
  if (!text) return null;
  return (
    <p className={`text-sm mt-3 ${error ? 'text-red-500' : 'text-sage-600'}`}>{text}</p>
  );
}

// ── Shipping ─────────────────────────────────────────────────────────────────

function ShippingPanel({ initial }: { initial: Shipping }) {
  const [threshold, setThreshold] = useState(String(initial.freeThreshold));
  const [flat, setFlat] = useState(String(initial.flatRate));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(''); setErr('');
    try {
      await post({ action: 'save-shipping', freeThreshold: Number(threshold), flatRate: Number(flat) });
      setMsg('✓ Shipping settings saved — live on the store now.');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const t = Number(threshold) || 0;
  const f = Number(flat) || 0;

  return (
    <form onSubmit={save} className="card p-6 max-w-xl">
      <h2 className="font-display text-xl text-ink-900">Shipping rules</h2>
      <p className="text-sm text-ink-500 mt-1">
        Applies to every order at checkout, on both card and PayPal.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <label className="block">
          <span className="text-sm font-medium text-ink-700">Free shipping at / above</span>
          <div className="relative mt-1.5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400">$</span>
            <input
              type="number" step="0.01" min="0" required value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink-700">Flat rate below that</span>
          <div className="relative mt-1.5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400">$</span>
            <input
              type="number" step="0.01" min="0" required value={flat}
              onChange={(e) => setFlat(e.target.value)}
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </div>
        </label>
      </div>

      <div className="mt-5 p-4 bg-cream-100 rounded-2xl text-sm text-ink-700">
        <strong className="text-ink-900">Preview:</strong>{' '}
        {f === 0
          ? 'Shipping is free on every order.'
          : <>Orders of <strong>${t.toFixed(2)}</strong> or more ship free. Below that, customers pay <strong>${f.toFixed(2)}</strong>.</>}
      </div>

      <button type="submit" disabled={busy} className="btn-primary mt-6 disabled:opacity-60">
        {busy ? 'Saving…' : 'Save shipping settings'}
      </button>
      <Msg text={msg} />
      <Msg text={err} error />
    </form>
  );
}

// ── Codes list + editor ──────────────────────────────────────────────────────

const BLANK = {
  code: '', type: 'percent' as const, value: '', description: '',
  expiresAt: '', minSubtotal: '', maxRedemptions: '', active: true,
};

function CodesPanel({ initial, onChange }: { initial: Coupon[]; onChange: () => void }) {
  const [form, setForm] = useState<any>(BLANK);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);

  const publicCodes = initial.filter((c) => !c.single_use);
  const generated = initial.filter((c) => c.single_use);

  function set<K extends string>(k: K, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(''); setErr('');
    try {
      await post({ action: 'save-coupon', ...form });
      setMsg(`✓ Code ${form.code.toUpperCase()} saved.`);
      setForm(BLANK);
      setEditing(false);
      onChange();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c: Coupon) {
    try { await post({ action: 'toggle-coupon', code: c.code, active: !c.active }); onChange(); }
    catch (e: any) { setErr(e.message); }
  }

  async function remove(c: Coupon) {
    try { await post({ action: 'delete-coupon', code: c.code }); onChange(); }
    catch (e: any) { setErr(e.message); }
  }

  function edit(c: Coupon) {
    setForm({
      code: c.code, type: c.type, value: c.value ?? '', description: c.description,
      expiresAt: c.expires_at ? c.expires_at.slice(0, 10) : '',
      minSubtotal: c.min_subtotal ?? '', maxRedemptions: c.max_redemptions ?? '',
      active: c.active,
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="space-y-8">
      {/* Editor */}
      <form onSubmit={save} className="card p-6">
        <h2 className="font-display text-xl text-ink-900">
          {editing ? `Edit ${form.code}` : 'Create a discount code'}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          <label className="block">
            <span className="text-sm font-medium text-ink-700">Code</span>
            <input
              required placeholder="SPRING20" value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9._-]/g, ''))}
              disabled={editing}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm font-mono tracking-wide disabled:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink-700">Type</span>
            <select
              value={form.type} onChange={(e) => set('type', e.target.value)}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            >
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed $ off</option>
              <option value="free-shipping">Free shipping</option>
            </select>
          </label>

          {form.type !== 'free-shipping' && (
            <label className="block">
              <span className="text-sm font-medium text-ink-700">
                {form.type === 'percent' ? 'Percent (%)' : 'Amount ($)'}
              </span>
              <input
                type="number" step="0.01" min="0" required value={form.value}
                onChange={(e) => set('value', e.target.value)}
                className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
            </label>
          )}

          <label className="block sm:col-span-2 lg:col-span-3">
            <span className="text-sm font-medium text-ink-700">Description <span className="text-ink-400 font-normal">(shown at checkout)</span></span>
            <input
              placeholder="20% off spring sale" value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink-700">Expires <span className="text-ink-400 font-normal">(optional)</span></span>
            <input
              type="date" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink-700">Min order $ <span className="text-ink-400 font-normal">(optional)</span></span>
            <input
              type="number" step="0.01" min="0" placeholder="No minimum" value={form.minSubtotal}
              onChange={(e) => set('minSubtotal', e.target.value)}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink-700">Max uses <span className="text-ink-400 font-normal">(optional)</span></span>
            <input
              type="number" min="1" placeholder="Unlimited" value={form.maxRedemptions}
              onChange={(e) => set('maxRedemptions', e.target.value)}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </label>
        </div>

        <label className="flex items-center gap-2.5 mt-5 cursor-pointer">
          <input
            type="checkbox" checked={form.active}
            onChange={(e) => set('active', e.target.checked)}
            className="w-4 h-4 accent-blush-400"
          />
          <span className="text-sm text-ink-700">Active — customers can use this code right now</span>
        </label>

        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? 'Saving…' : editing ? 'Update code' : 'Create code'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => { setForm(BLANK); setEditing(false); }}
              className="px-6 py-3 rounded-full border border-ink-900/12 text-sm font-medium text-ink-700 hover:border-blush-400"
            >
              Cancel
            </button>
          )}
        </div>
        <Msg text={msg} />
        <Msg text={err} error />
      </form>

      <CouponTable
        title="Your discount codes"
        empty="No codes yet — create your first one above."
        rows={publicCodes}
        onEdit={edit}
        onToggle={toggle}
        onDelete={remove}
      />

      <CouponTable
        title="Single-use codes"
        empty="No single-use codes yet. They're created automatically when someone signs up, or in the Generate tab."
        rows={generated}
        onToggle={toggle}
        onDelete={remove}
        showIssuedTo
      />
    </div>
  );
}

function CouponTable({
  title, empty, rows, onEdit, onToggle, onDelete, showIssuedTo,
}: {
  title: string; empty: string; rows: Coupon[];
  onEdit?: (c: Coupon) => void;
  onToggle: (c: Coupon) => void;
  onDelete: (c: Coupon) => void;
  showIssuedTo?: boolean;
}) {
  const [confirm, setConfirm] = useState<string | null>(null);

  function label(c: Coupon) {
    if (c.type === 'free-shipping') return 'Free shipping';
    if (c.type === 'percent') return `${c.value}% off`;
    return `$${Number(c.value).toFixed(2)} off`;
  }

  const expired = (c: Coupon) => !!c.expires_at && new Date(c.expires_at).getTime() < Date.now();
  const usedUp = (c: Coupon) =>
    c.max_redemptions != null && c.times_redeemed >= c.max_redemptions;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-xl text-ink-900">{title}</h2>
        <span className="text-sm text-ink-500">{rows.length}</span>
      </div>

      {rows.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-500">{empty}</div>
      ) : (
        <div className="card divide-y divide-ink-900/5">
          {rows.map((c) => {
            const dead = !c.active || expired(c) || usedUp(c);
            return (
              <div key={c.code} className="p-4 flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className={`font-mono text-sm font-semibold px-2.5 py-1 rounded-lg ${
                      dead ? 'bg-cream-200 text-ink-400 line-through' : 'bg-blush-50 text-blush-600'
                    }`}>
                      {c.code}
                    </code>
                    <span className="text-sm text-ink-700">{label(c)}</span>
                    {expired(c) && <Badge tone="amber">Expired</Badge>}
                    {usedUp(c) && <Badge tone="amber">Fully used</Badge>}
                    {!c.active && <Badge tone="grey">Off</Badge>}
                  </div>

                  <p className="text-xs text-ink-500 mt-1.5">
                    {c.description || 'No description'}
                    {c.min_subtotal != null && ` · min $${Number(c.min_subtotal).toFixed(2)}`}
                    {c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString()}`}
                    {' · used '}
                    {c.times_redeemed}
                    {c.max_redemptions != null ? ` / ${c.max_redemptions}` : ''}
                    {showIssuedTo && c.issued_to && ` · issued to ${c.issued_to}`}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigator.clipboard.writeText(c.code)}
                    className="text-xs px-3 py-1.5 rounded-full border border-ink-900/12 text-ink-700 hover:border-blush-400 hover:text-blush-500"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => onToggle(c)}
                    className="text-xs px-3 py-1.5 rounded-full border border-ink-900/12 text-ink-700 hover:border-blush-400 hover:text-blush-500"
                  >
                    {c.active ? 'Turn off' : 'Turn on'}
                  </button>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(c)}
                      className="text-xs px-3 py-1.5 rounded-full border border-ink-900/12 text-ink-700 hover:border-blush-400 hover:text-blush-500"
                    >
                      Edit
                    </button>
                  )}
                  {confirm === c.code ? (
                    <>
                      <button
                        onClick={() => { onDelete(c); setConfirm(null); }}
                        className="text-xs px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirm(null)}
                        className="text-xs px-3 py-1.5 rounded-full border border-ink-900/12 text-ink-700"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirm(c.code)}
                      className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-400 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Badge({ tone, children }: { tone: 'amber' | 'grey'; children: React.ReactNode }) {
  const cls = tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-cream-200 text-ink-500';
  return <span className={`text-[11px] px-2 py-0.5 rounded-full ${cls}`}>{children}</span>;
}

// ── Batch generator ──────────────────────────────────────────────────────────

function GeneratePanel({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState('10');
  const [prefix, setPrefix] = useState('MAMA');
  const [type, setType] = useState('percent');
  const [value, setValue] = useState('10');
  const [description, setDescription] = useState('Thanks for being here 💕');
  const [expiresAt, setExpiresAt] = useState('');
  const [minSubtotal, setMinSubtotal] = useState('');
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(''); setCodes([]);
    try {
      const data = await post({
        action: 'generate-batch',
        count: Number(count), prefix, type,
        value: type === 'free-shipping' ? null : Number(value),
        description, expiresAt: expiresAt || null,
        minSubtotal: minSubtotal || null,
      });
      setCodes(data.codes);
      onDone();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function copyAll() {
    navigator.clipboard.writeText(codes.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={generate} className="card p-6">
        <h2 className="font-display text-xl text-ink-900">Generate single-use codes</h2>
        <p className="text-sm text-ink-500 mt-1">
          Each code works exactly once, then switches itself off. Great for
          giveaways, influencer drops, or apology credits.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          <label className="block">
            <span className="text-sm font-medium text-ink-700">How many</span>
            <input
              type="number" min="1" max="200" required value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink-700">Prefix</span>
            <input
              required value={prefix} maxLength={8}
              onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
            <span className="text-xs text-ink-400 mt-1 block">e.g. {prefix || 'MAMA'}-K3F9QX</span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink-700">Type</span>
            <select
              value={type} onChange={(e) => setType(e.target.value)}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            >
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed $ off</option>
              <option value="free-shipping">Free shipping</option>
            </select>
          </label>

          {type !== 'free-shipping' && (
            <label className="block">
              <span className="text-sm font-medium text-ink-700">
                {type === 'percent' ? 'Percent (%)' : 'Amount ($)'}
              </span>
              <input
                type="number" step="0.01" min="0" required value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-ink-700">Expires <span className="text-ink-400 font-normal">(optional)</span></span>
            <input
              type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink-700">Min order $ <span className="text-ink-400 font-normal">(optional)</span></span>
            <input
              type="number" step="0.01" min="0" placeholder="No minimum" value={minSubtotal}
              onChange={(e) => setMinSubtotal(e.target.value)}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </label>

          <label className="block sm:col-span-2 lg:col-span-3">
            <span className="text-sm font-medium text-ink-700">Description</span>
            <input
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-white border border-ink-900/12 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </label>
        </div>

        <button type="submit" disabled={busy} className="btn-primary mt-6 disabled:opacity-60">
          {busy ? 'Generating…' : `Generate ${count || 0} codes`}
        </button>
        <Msg text={err} error />
      </form>

      {codes.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-ink-900">{codes.length} codes ready</h3>
            <button
              onClick={copyAll}
              className="text-xs px-4 py-2 rounded-full bg-blush-400 text-white hover:bg-blush-500"
            >
              {copied ? '✓ Copied all' : 'Copy all'}
            </button>
          </div>
          <div className="bg-cream-100 rounded-2xl p-4 max-h-72 overflow-y-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {codes.map((c) => (
                <code key={c} className="font-mono text-sm text-ink-900 bg-white px-3 py-2 rounded-lg text-center">
                  {c}
                </code>
              ))}
            </div>
          </div>
          <p className="text-xs text-ink-500 mt-3">
            Copy these now and store them somewhere safe — you can always find them
            again under the Discount codes tab.
          </p>
        </div>
      )}
    </div>
  );
}
