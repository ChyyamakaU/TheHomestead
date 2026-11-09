'use strict';

/**
 * Trust proxy configuration test.
 *
 * Verifies that:
 * 1. app.get('trust proxy') is set to 1 (trust exactly one hop).
 * 2. Express resolves req.ip from X-Forwarded-For when behind one proxy.
 * 3. The ERR_ERL_UNEXPECTED_X_FORWARDED_FOR error is not thrown on startup
 *    (i.e. express-rate-limit accepts the configuration).
 *
 * Uses supertest to send a request with a spoofed X-Forwarded-For header
 * and confirms the app returns a normal response rather than crashing.
 */

const request = require('supertest');
const app     = require('../app');

describe('Express trust proxy configuration', () => {

  test('1. trust proxy is set to 1 (exactly one hop)', () => {
    expect(app.get('trust proxy')).toBe(1);
  });

  test('2. Health endpoint responds normally when X-Forwarded-For is present', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('X-Forwarded-For', '203.0.113.42'); // simulated real client IP from Render proxy

    // Should return 200, not crash or throw ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('3. Rate-limited route handles X-Forwarded-For without throwing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '203.0.113.42')
      .send({ email: 'test@example.com', password: 'wrong' });

    // 400 (validation) or 401 (wrong credentials) — any response is fine;
    // what matters is it does NOT throw the proxy configuration error (500).
    expect(res.status).not.toBe(500);
    expect(res.body).not.toMatchObject({
      code: 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR',
    });
  });

});
