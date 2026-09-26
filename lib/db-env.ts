/**
 * Makes the database connection variables findable regardless of what Vercel
 * named them.
 *
 * ── Why this file exists ────────────────────────────────────────────
 * The Neon integration in Vercel has a "Custom Environment Variable Prefix"
 * setting. On this project it is set to MAMA_CARE_STORE, so Vercel publishes:
 *
 *   MAMA_CARE_STORE_POSTGRES_URL
 *   MAMA_CARE_STORE_POSTGRES_URL_NON_POOLING
 *   MAMA_CARE_STORE_DATABASE_URL          ...and so on
 *
 * But @vercel/postgres — and every `process.env.POSTGRES_URL` read in this
 * codebase — looks for the UNPREFIXED names. So the connection string the app
 * wants has not existed in production since the integration was reconnected.
 *
 * The "password authentication failed for user 'neondb_owner'" error was a red
 * herring: it came from the last deployment built while an old, unprefixed
 * POSTGRES_URL still existed, carrying a password Neon had since rotated. Two
 * different faults wearing one error message, which is why chasing the password
 * never fixed it.
 *
 * Clearing the prefix in Vercel looked like the obvious fix, but that field's
 * placeholder is "STORAGE" — emptying it may well rename everything to
 * STORAGE_POSTGRES_URL and leave us exactly as broken, one deploy later.
 * Reading whatever prefix happens to be there is deterministic and survives
 * anyone changing that setting again.
 *
 * ── What it does ────────────────────────────────────────────────────
 * For each connection variable the app expects, if the unprefixed name is
 * missing, find any environment variable ending in _<NAME> and alias it.
 * Runs once at module load, before any query is issued.
 *
 * Import this for its side effect — `import './db-env'` — at the top of any
 * module that talks to Postgres.
 */

const CONNECTION_VARS = [
  // Order matters only for logging; each is resolved independently.
  'POSTGRES_URL',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NO_SSL',
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'PGHOST',
  'PGHOST_UNPOOLED',
  'PGUSER',
  'PGDATABASE',
  'PGPASSWORD',
  'POSTGRES_USER',
  'POSTGRES_HOST',
  'POSTGRES_PASSWORD',
  'POSTGRES_DATABASE',
] as const;

/** Which variables we had to alias, and from where. Never includes values. */
export const aliasedFrom: Record<string, string> = {};

/** True when the app is running on prefixed variables rather than plain ones. */
export let usingPrefixedVars = false;

function resolve() {
  const keys = Object.keys(process.env);
  const preferBare = process.env.DB_ENV_PREFER_BARE === 'true';

  for (const name of CONNECTION_VARS) {
    // Exact suffix match only. `_POSTGRES_URL` must not match
    // `..._POSTGRES_URL_NON_POOLING`, or the pooled and direct connection
    // strings get swapped — which fails in a far more confusing way than
    // simply being absent.
    const suffix = `_${name}`;
    const source = keys.find((k) => k.endsWith(suffix) && process.env[k]);

    if (!source) continue;

    /**
     * The prefixed variable WINS, even when a bare one already exists.
     *
     * This is the subtle part, and getting it backwards is what kept the
     * "password authentication failed" error alive after the first fix.
     * This project still carries bare POSTGRES_URL / POSTGRES_URL_NON_POOLING
     * entries left over from an earlier manual attempt. They hold a password
     * Neon rotated long ago. The prefixed ones are published and rotated by
     * the Vercel–Neon integration, so they are the authoritative pair.
     *
     * Skipping a name because a bare value happened to exist meant quietly
     * preferring the dead credential over the live one.
     *
     * Set DB_ENV_PREFER_BARE=true to invert this — for the case where someone
     * deliberately points a bare variable at a different database.
     */
    if (process.env[name]) {
      if (preferBare) continue;
      if (process.env[name] === process.env[source]) continue; // already agree
      console.warn(
        `[db-env] ${name} was already set but is being overridden by ` +
          `${source}, which the Neon integration manages and rotates. Delete ` +
          `the bare ${name} in Vercel to silence this, or set ` +
          `DB_ENV_PREFER_BARE=true to keep the bare value.`
      );
    }

    process.env[name] = process.env[source];
    aliasedFrom[name] = source;
    usingPrefixedVars = true;
  }

  const count = Object.keys(aliasedFrom).length;
  if (count > 0) {
    // Names only — never values. This is the line that explains a working
    // database to whoever reads the logs next.
    console.log(
      `[db-env] Aliased ${count} prefixed connection variable(s) to their ` +
        `standard names: ${Object.entries(aliasedFrom)
          .map(([to, from]) => `${from} → ${to}`)
          .join(', ')}`
    );
  } else if (!process.env.POSTGRES_URL) {
    console.error(
      '[db-env] No POSTGRES_URL found, and no prefixed variable ending in ' +
        '_POSTGRES_URL either. The database will be unreachable. Check the ' +
        'Neon integration is still connected in Vercel → Storage.'
    );
  }
}

resolve();
