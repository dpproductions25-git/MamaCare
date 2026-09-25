import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Database connectivity check.
 *
 * Almost every "it saved but didn't change" symptom in this admin traces back
 * to the database being unreachable, because most read paths catch their own
 * errors and fall back to static data. That is deliberate — the storefront
 * should stay up if the DB blips — but it means a credential failure is
 * invisible until a write fails.
 *
 * This deliberately does NOT catch-and-fall-back: it reports the raw truth.
 */
export async function GET() {
  const started = Date.now();

  // Which connection variable is present (never the value itself)
  const vars = {
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
    POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
    DATABASE_URL: !!process.env.DATABASE_URL,
  };

  // Host only — useful for spotting a stale Neon endpoint, no credentials
  let host: string | null = null;
  try {
    const raw = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
    if (raw) host = new URL(raw).host;
  } catch {
    host = '(could not parse connection string)';
  }

  try {
    const r = await sql<{ now: string; db: string; usr: string }>`
      SELECT NOW()::text AS now, current_database() AS db, current_user AS usr;
    `;

    // Confirm the app's own tables exist, not just that we connected
    const tables = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    return NextResponse.json({
      connected: true,
      latencyMs: Date.now() - started,
      host,
      serverTime: r.rows[0]?.now,
      database: r.rows[0]?.db,
      user: r.rows[0]?.usr,
      tableCount: tables.rows.length,
      tables: tables.rows.map((t) => t.table_name),
      envVarsPresent: vars,
    });
  } catch (e: any) {
    const message = e?.message || String(e);
    const isAuth = /password authentication failed|role .* does not exist/i.test(message);

    return NextResponse.json(
      {
        connected: false,
        latencyMs: Date.now() - started,
        host,
        error: message,
        envVarsPresent: vars,
        likelyCause: isAuth
          ? 'The stored connection string no longer matches the database password. ' +
            'Neon rotates credentials when a project is reset, restored, or reconnected — ' +
            'copy a fresh connection string from Neon and update it in Vercel.'
          : 'Connection failed for a reason other than credentials — check the Neon ' +
            'project is active and the host in the connection string still exists.',
        impact:
          'While this is failing: admin-created products disappear from the storefront, ' +
          'price overrides are ignored, the registry is unavailable, discount codes fall ' +
          'back to the hardcoded list, and new orders may not be recorded.',
      },
      { status: 500 }
    );
  }
}
