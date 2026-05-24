import type { MetadataRoute } from 'next';
import { categories } from '@/lib/products';
import { getMergedProducts } from '@/lib/product-overrides';
import { getAllPosts } from '@/lib/blog';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 60; // refresh sitemap every minute

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const allProducts = await getMergedProducts();

  const staticPaths: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,         lastModified: now, changeFrequency: 'weekly',  priority: 1 },
    { url: `${SITE_URL}/shop`,     lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/blog`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/about`,    lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`,  lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/faq`,      lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/returns`,  lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`,  lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/terms`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.3 }
  ];

  const categoryPaths: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/shop/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7
  }));

  const productPaths: MetadataRoute.Sitemap = allProducts.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  const blogPaths: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly',
    priority: 0.7
  }));

  return [...staticPaths, ...categoryPaths, ...productPaths, ...blogPaths];
}
