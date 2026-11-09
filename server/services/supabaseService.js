'use strict';

/**
 * supabaseService.js
 *
 * Server-side communication with Supabase Auth REST API.
 * Uses Node's built-in https module — no extra npm package needed.
 *
 * The SERVICE ROLE KEY is used here to call getUser(accessToken).
 * It NEVER leaves the server and is NEVER sent to the frontend.
 *
 * The Supabase ANON key lives only in the frontend (.env VITE_SUPABASE_ANON_KEY).
 */

const https = require('https');

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Make an authenticated request to the Supabase REST API.
 */
function supabaseRequest(method, path, body, authHeader) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const urlObj  = new URL(SUPABASE_URL);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path,
      method,
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: authHeader || `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { reject(new Error('Invalid JSON response from Supabase')); }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Verify a Supabase access token and return the authenticated user.
 *
 * Calls: GET /auth/v1/user
 * with the user's access token as the Bearer token.
 *
 * Returns the Supabase user object:
 *   { id, email, user_metadata: { full_name, avatar_url, ... }, ... }
 *
 * Throws if the token is invalid, expired, or the request fails.
 */
async function getSupabaseUser(accessToken) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are not configured on the server.');
  }

  const urlObj = new URL(SUPABASE_URL);
  const result = await supabaseRequest(
    'GET',
    '/auth/v1/user',
    null,
    `Bearer ${accessToken}`
  );

  if (result.status !== 200 || !result.body?.id) {
    throw new Error('Invalid or expired Supabase access token.');
  }

  return result.body; // { id, email, user_metadata, ... }
}

module.exports = { getSupabaseUser };
