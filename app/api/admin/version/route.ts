import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Which commit is actually live?
 *
 * Answers "did my push deploy?" without guessing. Vercel injects these
 * VERCEL_GIT_* variables at build time, so the values below are baked into
 * whatever build is currently serving traffic — compare the commit against
 * GitHub Desktop's History to confirm a deploy landed.
 *
 * Admin-protected so repository details aren't public.
 */
export async function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || null;

  return NextResponse.json({
    liveCommit: sha ? sha.slice(0, 7) : '(not set — not a Vercel build)',
    fullSha: sha,
    commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || null,
    branch: process.env.VERCEL_GIT_COMMIT_REF || null,
    repo: process.env.VERCEL_GIT_REPO_SLUG || null,
    owner: process.env.VERCEL_GIT_REPO_OWNER || null,
    environment: process.env.VERCEL_ENV || 'local',
    region: process.env.VERCEL_REGION || null,
    // Fixed at build time, so it tells you when this bundle was compiled —
    // not when you happened to load the page.
    builtAt: BUILD_TIME,
    checkedAt: new Date().toISOString(),
    hint:
      'Compare liveCommit against the newest commit in GitHub Desktop → History. ' +
      'If they differ, Vercel has not deployed your latest push.',
  });
}

// Evaluated once when the bundle is compiled.
const BUILD_TIME = new Date().toISOString();
