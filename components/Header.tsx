'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart';
import { products, categories, getProductsByCategory, getBestSellers } from '@/lib/products';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopMegaOpen, setShopMegaOpen] = useState(false);
  const [count, setCount] = useState(0);
  const items = useCart((s) => s.items);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCount(items.reduce((n, i) => n + i.qty, 0));
  }, [items]);

  // Delay closing the megamenu so the user has a moment to move into it.
  function openShop() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShopMegaOpen(true);
  }
  function deferCloseShop() {
    closeTimer.current = setTimeout(() => setShopMegaOpen(false), 150);
  }

  return (
    <header className="sticky top-0 z-40 bg-cream-50/85 backdrop-blur border-b border-ink-900/5">
      <div className="container-page flex items-center justify-between h-16 sm:h-20 relative">
        {/* Logo */}
        <Link href="/" className="font-display text-2xl sm:text-3xl text-ink-900 tracking-tight">
          Mama<span className="text-blush-400">Care</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm text-ink-700">
          {/* "Shop" — opens megamenu on hover */}
          <div
            onMouseEnter={openShop}
            onMouseLeave={deferCloseShop}
            onFocus={openShop}
            onBlur={deferCloseShop}
            className="relative"
          >
            <Link
              href="/shop"
              className="hover:text-blush-500 transition-colors inline-flex items-center gap-1"
              aria-haspopup="true"
              aria-expanded={shopMegaOpen}
            >
              Shop
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <Link href="/shop/gear" className="hover:text-blush-500 transition-colors">Gear</Link>
          <Link href="/shop/sleep" className="hover:text-blush-500 transition-colors">Sleep</Link>
          <Link href="/shop/feeding" className="hover:text-blush-500 transition-colors">Feeding</Link>
          <Link href="/shop/nursery" className="hover:text-blush-500 transition-colors">Nursery</Link>
          <Link href="/shop/toys" className="hover:text-blush-500 transition-colors">Toys</Link>
          <Link href="/blog" className="hover:text-blush-500 transition-colors">Journal</Link>
          <Link href="/about" className="hover:text-blush-500 transition-colors">About</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-cream-100"
            aria-label={`Cart with ${count} items`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 5h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="20" r="1.4"/>
              <circle cx="17" cy="20" r="1.4"/>
            </svg>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-blush-400 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-cream-100"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ─── Desktop Mega Menu ─── */}
      {shopMegaOpen && (
        <div
          onMouseEnter={openShop}
          onMouseLeave={deferCloseShop}
          className="hidden md:block absolute left-0 right-0 top-full bg-white shadow-card border-t border-ink-900/5 animate-fadeUp"
        >
          <div className="container-page py-8 grid grid-cols-12 gap-8">
            {/* Categories (with item counts + best seller preview) */}
            <div className="col-span-7 grid grid-cols-3 gap-x-6 gap-y-5">
              {categories.map((c) => {
                const items = getProductsByCategory(c.slug);
                if (items.length === 0) return null;
                return (
                  <Link
                    key={c.slug}
                    href={`/shop/${c.slug}`}
                    onClick={() => setShopMegaOpen(false)}
                    className="group"
                  >
                    <p className="font-display text-lg text-ink-900 group-hover:text-blush-500 transition-colors">
                      {c.label}
                      <span className="text-xs text-ink-500 ml-1 font-sans">({items.length})</span>
                    </p>
                    <p className="text-xs text-ink-500 mt-1 line-clamp-2">{c.description}</p>
                  </Link>
                );
              })}
            </div>

            {/* Quick filters */}
            <div className="col-span-2">
              <p className="font-medium text-ink-900 mb-3 text-sm">Browse by</p>
              <ul className="space-y-2 text-sm text-ink-700">
                <li><Link href="/shop" onClick={() => setShopMegaOpen(false)} className="hover:text-blush-500">All products</Link></li>
                <li><Link href="/shop" onClick={() => setShopMegaOpen(false)} className="hover:text-blush-500">Best sellers</Link></li>
                <li><Link href="/shop" onClick={() => setShopMegaOpen(false)} className="hover:text-blush-500">On sale</Link></li>
                <li><Link href="/shop" onClick={() => setShopMegaOpen(false)} className="hover:text-blush-500">New arrivals</Link></li>
              </ul>
              <p className="font-medium text-ink-900 mb-3 mt-6 text-sm">Read</p>
              <ul className="space-y-2 text-sm text-ink-700">
                <li><Link href="/blog" onClick={() => setShopMegaOpen(false)} className="hover:text-blush-500">The Journal</Link></li>
                <li><Link href="/blog/newborn-essentials-checklist" onClick={() => setShopMegaOpen(false)} className="hover:text-blush-500">Newborn checklist</Link></li>
                <li><Link href="/blog/best-baby-carriers-2026" onClick={() => setShopMegaOpen(false)} className="hover:text-blush-500">Carrier guide</Link></li>
              </ul>
            </div>

            {/* Featured product */}
            <div className="col-span-3">
              <p className="font-medium text-ink-900 mb-3 text-sm">Featured</p>
              {getBestSellers().slice(0, 1).map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  onClick={() => setShopMegaOpen(false)}
                  className="block group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-100">
                    <Image src={p.image} alt={p.name} fill sizes="240px" className="object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <p className="font-display text-sm text-ink-900 mt-2 group-hover:text-blush-500 line-clamp-2">{p.name}</p>
                  <p className="text-sm text-ink-900 font-medium mt-0.5">${p.price.toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile menu ─── */}
      {mobileOpen && (
        <nav aria-label="Mobile" className="md:hidden border-t border-ink-900/5 bg-cream-50">
          <div className="container-page py-4 flex flex-col gap-3 text-ink-700">
            <Link onClick={() => setMobileOpen(false)} href="/shop">Shop all</Link>
            <Link onClick={() => setMobileOpen(false)} href="/shop/gear">Baby Gear</Link>
            <Link onClick={() => setMobileOpen(false)} href="/shop/baby">Clothing &amp; Essentials</Link>
            <Link onClick={() => setMobileOpen(false)} href="/shop/sleep">Sleep</Link>
            <Link onClick={() => setMobileOpen(false)} href="/shop/feeding">Feeding &amp; Care</Link>
            <Link onClick={() => setMobileOpen(false)} href="/shop/nursery">Nursery</Link>
            <Link onClick={() => setMobileOpen(false)} href="/shop/toys">Toys &amp; Play</Link>
            <Link onClick={() => setMobileOpen(false)} href="/blog">Journal</Link>
            <Link onClick={() => setMobileOpen(false)} href="/about">About</Link>
            <Link onClick={() => setMobileOpen(false)} href="/contact">Contact</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
