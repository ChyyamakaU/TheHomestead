'use strict';

/**
 * paystackService.js
 *
 * All direct communication with the Paystack API lives here.
 * The secret key NEVER leaves the server — it is only read from
 * process.env and used in server-side HTTPS requests.
 *
 * Uses Node's built-in https module — no extra npm package needed.
 */

const https = require('https');

const SECRET_KEY  = process.env.PAYSTACK_SECRET_KEY;
const BASE_HOST   = 'api.paystack.co';

/**
 * Make an authenticated HTTPS request to Paystack.
 * @param {string} method   - GET | POST | PUT
 * @param {string} path     - e.g. '/transaction/initialize'
 * @param {object} [body]   - JSON body for POST/PUT
 * @returns {Promise<object>} parsed JSON response
 */
function paystackRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: BASE_HOST,
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid JSON response from Paystack'));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Initialize a Paystack transaction.
 * @param {object} params
 * @param {string} params.email        - customer email
 * @param {number} params.amount       - amount in KOBO (multiply NGN by 100)
 * @param {string} params.reference    - our unique payment reference
 * @param {string} params.callback_url - URL Paystack redirects to after payment
 * @param {object} [params.metadata]   - optional extra data stored on Paystack
 * @returns {Promise<{authorization_url, access_code, reference}>}
 */
async function initializeTransaction({ email, amount, reference, callback_url, metadata }) {
  const response = await paystackRequest('POST', '/transaction/initialize', {
    email,
    amount: Math.round(amount * 100), // convert NGN to kobo
    reference,
    callback_url,
    metadata: metadata || {},
  });

  if (!response.status) {
    throw new Error(response.message || 'Paystack initialization failed');
  }

  return response.data; // { authorization_url, access_code, reference }
}

/**
 * Verify a Paystack transaction by reference.
 * MUST be called server-side — never trust the frontend's success callback alone.
 * @param {string} reference
 * @returns {Promise<object>} Paystack transaction data
 */
async function verifyTransaction(reference) {
  const response = await paystackRequest(
    'GET',
    `/transaction/verify/${encodeURIComponent(reference)}`
  );

  if (!response.status) {
    throw new Error(response.message || 'Paystack verification failed');
  }

  return response.data; // { status, amount, reference, customer, metadata, ... }
}

/**
 * Verify a Paystack webhook signature.
 * Paystack signs the raw request body with HMAC-SHA512 using the secret key.
 * We compare their signature with ours — if they match, the webhook is genuine.
 * @param {string|Buffer} rawBody      - the raw request body (not parsed)
 * @param {string}        signature    - value of x-paystack-signature header
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBody, signature) {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', SECRET_KEY)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

module.exports = { initializeTransaction, verifyTransaction, verifyWebhookSignature };
