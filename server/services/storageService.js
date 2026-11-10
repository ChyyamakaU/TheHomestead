'use strict';

/**
 * storageService.js
 *
 * Persistent object storage for apartment images.
 *
 * Render (and most PaaS hosts) uses an ephemeral filesystem: files written to
 * server/uploads are lost whenever the service is redeployed or restarted.
 * The database keeps the image rows, so the API returns URLs that 404.
 *
 * This service uploads images to a public Supabase Storage bucket instead.
 * The bucket is created automatically the first time an image is uploaded.
 *
 * If SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured, the caller
 * falls back to the local filesystem (useful for offline development).
 */

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'apartment-images';
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const OBJECT_PREFIX = 'apartments';

// Cache the bucket check so we only hit the API once per process.
let bucketReady = null;

function isStorageConfigured() {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

function authHeaders(extra = {}) {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    ...extra,
  };
}

async function readError(response) {
  try {
    const body = await response.json();
    return body.message || body.error || JSON.stringify(body);
  } catch {
    return response.statusText || `HTTP ${response.status}`;
  }
}

/**
 * Make sure the public bucket exists. Safe to call on every upload — the
 * result is cached after the first successful check.
 */
async function ensureBucket() {
  if (!isStorageConfigured()) return false;

  if (!bucketReady) {
    bucketReady = (async () => {
      const check = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET}`, {
        headers: authHeaders(),
      });

      if (check.ok) return true;

      // Supabase wraps a missing bucket in a 400 response with code
      // "NoSuchBucket" (older deployments return a plain 404).
      let checkError = '';
      try {
        const body = await check.json();
        checkError = body.code || body.message || '';
      } catch {
        checkError = check.statusText || '';
      }

      const missingBucket =
        check.status === 404 ||
        checkError === 'NoSuchBucket' ||
        /not found/i.test(checkError);

      if (!missingBucket) {
        throw new Error(
          `Unable to access Supabase Storage bucket "${BUCKET}": ${checkError || check.status}`
        );
      }

      const create = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          id: BUCKET,
          name: BUCKET,
          public: true,
        }),
      });

      // 409 means another request created it at the same time.
      if (!create.ok && create.status !== 409) {
        throw new Error(
          `Unable to create Supabase Storage bucket "${BUCKET}": ${await readError(create)}`
        );
      }

      return true;
    })().catch((error) => {
      // Allow a later request to retry after a transient failure.
      bucketReady = null;
      throw error;
    });
  }

  return bucketReady;
}

/**
 * Build the public URL for an object in the bucket.
 * @param {string} objectPath — path inside the bucket (e.g. "apartments/1.jpg")
 * @returns {string}
 */
function getPublicUrl(objectPath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

/**
 * Upload one image buffer to Supabase Storage.
 *
 * @param {Buffer} buffer
 * @param {string} filename — unique filename, e.g. "1793751409317-753371.jpg"
 * @param {string} mimetype
 * @returns {Promise<string>} public URL
 */
async function uploadImage(buffer, filename, mimetype) {
  await ensureBucket();

  const objectPath = `${OBJECT_PREFIX}/${filename}`;
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`,
    {
      method: 'POST',
      headers: authHeaders({
        'Content-Type': mimetype || 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
        'x-upsert': 'true',
      }),
      body: buffer,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to upload image to Supabase Storage: ${await readError(response)}`
    );
  }

  return getPublicUrl(objectPath);
}

/**
 * Delete one image from Supabase Storage.
 * Missing objects are ignored so deleting a DB row never fails because the
 * file was already removed.
 *
 * @param {string} filename
 */
async function deleteImage(filename) {
  if (!isStorageConfigured() || !filename) return;

  await ensureBucket();

  const objectPath = `${OBJECT_PREFIX}/${filename}`;
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    }
  );

  if (!response.ok && response.status !== 404) {
    let errorCode = '';
    try {
      const body = await response.json();
      errorCode = body.code || body.message || '';
    } catch {
      errorCode = response.statusText || '';
    }

    // Supabase reports a missing object as 400 + code "NoSuchKey".
    if (errorCode === 'NoSuchKey' || /not found/i.test(errorCode)) return;

    throw new Error(
      `Unable to delete image from Supabase Storage: ${errorCode || response.status}`
    );
  }
}

module.exports = {
  BUCKET,
  isStorageConfigured,
  ensureBucket,
  getPublicUrl,
  uploadImage,
  deleteImage,
};
