import { createClient } from '@supabase/supabase-js';

function normalizeEmail(value = '') {
  return String(value || '').toLowerCase().trim();
}

function authClient() {
  const url = process.env.SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    '';
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function supabaseAuthConfigured() {
  return !!authClient();
}

export function strictAuthRequired() {
  if (process.env.REQUIRE_STRICT_AUTH === 'true') return true;
  if (process.env.NODE_ENV === 'production') return true;
  return false;
}

export function extractBearerToken(req) {
  const header = String(req.headers?.authorization || '');
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  return '';
}

/**
 * Verifies Supabase access token when configured.
 * In production (or REQUIRE_STRICT_AUTH=true), token is always required.
 */
export async function resolveRequestUser(req, { emailHints = [] } = {}) {
  const hinted = normalizeEmail(
    emailHints.find(Boolean) ||
      req.body?.adminEmail ||
      req.body?.email ||
      req.query?.adminEmail ||
      req.query?.email ||
      ''
  );
  const token = extractBearerToken(req);
  const client = authClient();
  const strict = strictAuthRequired();

  if (strict && !client) {
    return {
      ok: false,
      status: 503,
      error: 'Server auth is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or PUBLISHABLE/ANON key).'
    };
  }

  if (client && token) {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user?.email) {
      return { ok: false, status: 401, error: 'Invalid or expired session. Sign in again.' };
    }
    return {
      ok: true,
      email: normalizeEmail(data.user.email),
      user: data.user,
      token,
      strict: true
    };
  }

  if (client && !token) {
    return { ok: false, status: 401, error: 'Authorization Bearer token required.' };
  }

  if (strict) {
    return { ok: false, status: 401, error: 'Authorization Bearer token required.' };
  }

  if (!hinted) {
    return { ok: false, status: 400, error: 'Email required' };
  }
  return { ok: true, email: hinted, user: null, token: '', strict: false, relaxed: true };
}

export async function requireMatchingUser(req, expectedEmail) {
  const auth = await resolveRequestUser(req, { emailHints: [expectedEmail] });
  if (!auth.ok) return auth;
  const expected = normalizeEmail(expectedEmail);
  if (expected && auth.email !== expected) {
    return { ok: false, status: 403, error: 'Session email does not match request.' };
  }
  return auth;
}
