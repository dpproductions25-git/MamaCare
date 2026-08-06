import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * Crawler policy.
 *
 * AI assistants are now a real discovery channel, and several use SEPARATE
 * user-agents from their search crawlers. Notably `Google-Extended` governs
 * whether your content can be used in AI Overviews and Gemini — a wildcard
 * Allow does not clearly cover it, and staying silent means missing out on
 * exactly the surface where a small store can outrank a big one.
 *
 * Each is listed explicitly so the intent is unambiguous, while private routes
 * stay blocked for all of them.
 */

const PRIVATE_PATHS = ['/api/', '/checkout', '/cart', '/admin'];

// AI crawlers used for training, retrieval and answer citation.
const AI_AGENTS = [
  'GPTBot',            // OpenAI — training
  'OAI-SearchBot',     // OpenAI — ChatGPT search results
  'ChatGPT-User',      // OpenAI — live user-triggered fetches
  'ClaudeBot',         // Anthropic
  'anthropic-ai',      // Anthropic (legacy agent)
  'Claude-Web',        // Anthropic (live fetches)
  'PerplexityBot',     // Perplexity
  'Perplexity-User',
  'Google-Extended',   // Google AI Overviews / Gemini grounding
  'Applebot-Extended', // Apple Intelligence
  'CCBot',             // Common Crawl — feeds many models
  'Bingbot',           // Bing + Copilot
  'DuckAssistBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      ...AI_AGENTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
