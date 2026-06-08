const crypto = require('crypto');

// In-memory token store: { token -> expiresAt }
// Note: resets on cold start, which is acceptable for this use case
const validTokens = new Map();
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// Clean expired tokens periodically
function purgeExpired() {
  const now = Date.now();
  for (const [t, exp] of validTokens) {
    if (now > exp) validTokens.delete(t);
  }
}

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Password, X-Token',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  purgeExpired();

  const correctPassword = process.env.SITE_PASSWORD;
  const sheetUrl = process.env.SHEET_CSV_URL;

  // ── Path A: Login with password ──────────────────────────
  const submittedPassword = event.headers['x-password'] || '';
  if (submittedPassword) {
    // Constant-time comparison to prevent timing attacks
    const pwBuf  = Buffer.from(submittedPassword);
    const okBuf  = Buffer.from(correctPassword || '');
    const match  = pwBuf.length === okBuf.length &&
                   crypto.timingSafeEqual(pwBuf, okBuf);

    if (!match) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // Issue a session token
    const token = crypto.randomBytes(32).toString('hex');
    validTokens.set(token, Date.now() + TOKEN_TTL_MS);

    // Fetch data and return together with token
    if (!sheetUrl) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Sheet URL not configured' }) };
    }
    try {
      const res = await fetch(sheetUrl);
      if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
      const csv = await res.text();
      return { statusCode: 200, headers, body: JSON.stringify({ token, csv }) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  // ── Path B: Subsequent requests with token ────────────────
  const submittedToken = event.headers['x-token'] || '';
  if (submittedToken && validTokens.has(submittedToken)) {
    if (!sheetUrl) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Sheet URL not configured' }) };
    }
    try {
      const res = await fetch(sheetUrl);
      if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
      const csv = await res.text();
      return { statusCode: 200, headers, body: JSON.stringify({ csv }) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  // ── No valid credential ───────────────────────────────────
  return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
};
