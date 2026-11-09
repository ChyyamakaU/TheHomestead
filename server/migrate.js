'use strict';

/**
 * migrate.js
 *
 * Runs Sequelize migrations before the server starts in production.
 * Called by the "start:prod" npm script:  node migrate.js && node server.js
 *
 * Behaviour:
 *  - NODE_ENV === 'production'  → runs `sequelize-cli db:migrate --env production`
 *                                 exits 1 on failure so the server never starts
 *  - Any other NODE_ENV          → skips migration and exits 0 immediately
 *    (local dev uses `npm run dev`; tests use their own NODE_ENV=test)
 *
 * Why a separate script rather than modifying server.js?
 *  - Keeps the migration concern isolated and easy to audit
 *  - server.js and app.js stay unchanged
 *  - The exit code of this script controls whether `&& node server.js` runs
 */

const { execSync } = require('child_process');

const env = process.env.NODE_ENV || 'development';

if (env !== 'production') {
  // Not production — nothing to do. Dev starts with `npm run dev`.
  console.log(`[migrate] NODE_ENV is '${env}' — skipping production migration step.`);
  process.exit(0);
}

console.log('[migrate] NODE_ENV is production — running database migrations...');

try {
  execSync('npx sequelize-cli db:migrate --env production', {
    stdio: 'inherit', // stream migration output directly to Render's log
    cwd: __dirname,   // run from the server directory regardless of CWD
  });
  console.log('[migrate] Migrations completed successfully.');
  process.exit(0);
} catch (err) {
  // execSync throws when the child process exits non-zero.
  // The child's stderr is already printed via stdio:'inherit'.
  console.error('[migrate] Migration failed — aborting server startup.');
  process.exit(1); // prevents `&& node server.js` from running
}
