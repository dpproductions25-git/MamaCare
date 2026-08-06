/**
 * AI alt-text generation via OpenAI vision.
 *
 * Uses gpt-4o-mini: cheap enough to run across a whole catalogue (fractions of
 * a cent per image) and more than capable of describing a product photo.
 *
 * No SDK dependency — one fetch call keeps the bundle small and avoids another
 * package to keep updated.
 */

const MODEL = 'gpt-4o-mini';
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export const AI_ENABLED = !!process.env.OPENAI_API_KEY;

/**
 * Written to produce alt text that is actually useful, which is narrower than
 * "describe this image":
 *  - screen readers cut off around 125 characters
 *  - "image of" / "photo of" is redundant; the tag already says it's an image
 *  - naming the product type is what earns Google Images traffic
 */
const SYSTEM_PROMPT = `You write alt text for product photos on a baby and maternity store.

Rules:
- One sentence, under 120 characters.
- Describe what is actually visible: product type, colour, material, notable features.
- Never begin with "image of", "photo of", or "picture of".
- No marketing language, no price, no brand claims.
- If a baby or model appears, mention them plainly and respectfully (e.g. "a baby resting in...").
- If the photo is a size chart, packaging, or diagram, say so.
- Output only the alt text. No quotes, no preamble.`;

export type AltResult = {
  imageUrl: string;
  altText?: string;
  error?: string;
};

export async function generateAltText(
  imageUrl: string,
  context?: { productName?: string; category?: string }
): Promise<AltResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { imageUrl, error: 'OPENAI_API_KEY is not set' };

  const hint = context?.productName
    ? `This image is from a product listed as "${context.productName}"${
        context.category ? ` in the ${context.category} category` : ''
      }. Use that only as context — describe what you can actually see.`
    : 'Describe what you can see.';

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 100,
        temperature: 0.3, // low — this is description, not creative writing
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: hint },
              // "low" detail is plenty for a description and materially cheaper
              { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
            ],
          },
        ],
      }),
    });

    const data: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        imageUrl,
        error: data?.error?.message || `OpenAI returned ${res.status}`,
      };
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return { imageUrl, error: 'No description returned' };

    // Strip quotes the model occasionally wraps around its answer
    const clean = text.replace(/^["']|["']$/g, '').slice(0, 125);
    return { imageUrl, altText: clean };
  } catch (e: any) {
    return { imageUrl, error: e?.message || 'Request failed' };
  }
}

/**
 * Check an image is reachable and large enough to render sharply.
 *
 * Far more valuable than "AI enhancement": Next.js already handles format and
 * resizing, so the only genuine image problems left are dead URLs and sources
 * too small for the space they're displayed in.
 */
export type ImageHealth = {
  imageUrl: string;
  ok: boolean;
  status?: number;
  bytes?: number;
  issue?: string;
};

export async function checkImageHealth(imageUrl: string): Promise<ImageHealth> {
  try {
    const res = await fetch(imageUrl, { method: 'HEAD' });
    if (!res.ok) {
      return { imageUrl, ok: false, status: res.status, issue: `Broken — returns ${res.status}` };
    }

    const len = Number(res.headers.get('content-length') || 0);
    // Under ~15KB a product photo is almost certainly too low-resolution to
    // look sharp on a retina screen at full width.
    if (len > 0 && len < 15_000) {
      return { imageUrl, ok: true, bytes: len, status: res.status, issue: 'Very low resolution — likely to look blurry' };
    }

    return { imageUrl, ok: true, bytes: len || undefined, status: res.status };
  } catch (e: any) {
    return { imageUrl, ok: false, issue: `Unreachable — ${e?.message || 'network error'}` };
  }
}
