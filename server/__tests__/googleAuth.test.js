'use strict';

/**
 * Google OAuth / Supabase auth tests
 *
 * Tests the POST /api/auth/google/callback endpoint end-to-end
 * (controller logic only — supabaseService is mocked).
 *
 * Scenarios:
 *  1. Missing access_token → 400
 *  2. Invalid / expired Supabase token → 401
 *  3. New Google user → tenant account created, JWT cookie set
 *  4. Returning Google user (supabase_id match) → existing account used, JWT cookie set
 *  5. Google email matches existing password account → separate account created (no linking)
 *  6. Deactivated account → 401
 *  7. Admin cannot be created via Google (role always 'tenant')
 *  8. Response never contains a password field
 */

// ─── Mock supabaseService ────────────────────────────────────────────────────
jest.mock('../services/supabaseService', () => ({
  getSupabaseUser: jest.fn(),
}));

// ─── Mock User model ─────────────────────────────────────────────────────────
const mockUser = {};
jest.mock('../models', () => ({ User: mockUser }));

// ─── Mock jsonwebtoken ───────────────────────────────────────────────────────
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock.jwt.token'),
}));

const { getSupabaseUser } = require('../services/supabaseService');
const { googleCallback }  = require('../controllers/authController');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeReq = (body = {}) => ({ body, cookies: {} });
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};
const next = jest.fn();

// Safe user object returned by toSafeObject()
const makeSafeUser = (overrides = {}) => ({
  id: 1,
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  phone: null,
  role: 'tenant',
  is_active: true,
  created_at: new Date(),
  ...overrides,
});

// Full User instance with instance methods
const makeUserInstance = (overrides = {}) => ({
  id: 1,
  supabase_id: 'supabase-uuid-123',
  email: 'ada@example.com',
  first_name: 'Ada',
  last_name: 'Lovelace',
  role: 'tenant',
  is_active: true,
  toSafeObject: jest.fn(() => makeSafeUser(overrides)),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test_secret';
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/google/callback', () => {

  test('1. Returns 400 when access_token is missing', async () => {
    const req = makeReq({});
    const res = makeRes();

    await googleCallback(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' })
    );
    expect(getSupabaseUser).not.toHaveBeenCalled();
  });

  test('2. Returns 401 when Supabase token is invalid', async () => {
    getSupabaseUser.mockRejectedValue(new Error('Invalid token'));
    mockUser.findOne = jest.fn();

    const req = makeReq({ access_token: 'bad-token' });
    const res = makeRes();

    await googleCallback(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockUser.findOne).not.toHaveBeenCalled();
  });

  test('3. New Google user gets a tenant account created and JWT cookie set', async () => {
    getSupabaseUser.mockResolvedValue({
      id: 'supabase-new-uuid',
      email: 'newuser@gmail.com',
      user_metadata: { full_name: 'Ada Lovelace' },
    });

    const newUser = makeUserInstance({ supabase_id: 'supabase-new-uuid', email: 'newuser@gmail.com' });
    mockUser.findOne = jest.fn().mockResolvedValue(null); // not found by supabase_id
    mockUser.create  = jest.fn().mockResolvedValue(newUser);

    const req = makeReq({ access_token: 'valid-token' });
    const res = makeRes();

    await googleCallback(req, res, next);

    // Account created with tenant role and no password
    expect(mockUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase_id: 'supabase-new-uuid',
        email: 'newuser@gmail.com',
        role: 'tenant',
        password: null,
      })
    );

    // JWT cookie set
    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      'mock.jwt.token',
      expect.objectContaining({ httpOnly: true })
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('4. Returning Google user is found by supabase_id — no new account created', async () => {
    getSupabaseUser.mockResolvedValue({
      id: 'supabase-existing-uuid',
      email: 'ada@example.com',
      user_metadata: { full_name: 'Ada Lovelace' },
    });

    const existingUser = makeUserInstance({ supabase_id: 'supabase-existing-uuid' });
    mockUser.findOne = jest.fn().mockResolvedValue(existingUser);
    mockUser.create  = jest.fn();

    const req = makeReq({ access_token: 'valid-token' });
    const res = makeRes();

    await googleCallback(req, res, next);

    // Existing user found — no new account
    expect(mockUser.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.cookie).toHaveBeenCalledWith('token', 'mock.jwt.token', expect.anything());
  });

  test('5. Google email matching a password account does NOT auto-link — new account created', async () => {
    // Supabase user has the same email as an existing password account
    getSupabaseUser.mockResolvedValue({
      id: 'supabase-brand-new-uuid',
      email: 'existing@example.com',
      user_metadata: { full_name: 'Existing User' },
    });

    // findOne by supabase_id returns null (no existing Google link)
    mockUser.findOne = jest.fn().mockResolvedValue(null);

    const createdUser = makeUserInstance({
      supabase_id: 'supabase-brand-new-uuid',
      email: 'existing@example.com',
    });
    mockUser.create = jest.fn().mockResolvedValue(createdUser);

    const req = makeReq({ access_token: 'valid-token' });
    const res = makeRes();

    await googleCallback(req, res, next);

    // A new account is created (separate from any password account)
    expect(mockUser.create).toHaveBeenCalledWith(
      expect.objectContaining({ supabase_id: 'supabase-brand-new-uuid' })
    );
    // The lookup was by supabase_id only — no email-based lookup
    expect(mockUser.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { supabase_id: 'supabase-brand-new-uuid' } })
    );
  });

  test('6. Returns 401 for deactivated accounts', async () => {
    getSupabaseUser.mockResolvedValue({
      id: 'supabase-deactivated-uuid',
      email: 'banned@example.com',
      user_metadata: {},
    });

    const deactivatedUser = makeUserInstance({ is_active: false, supabase_id: 'supabase-deactivated-uuid' });
    mockUser.findOne = jest.fn().mockResolvedValue(deactivatedUser);

    const req = makeReq({ access_token: 'valid-token' });
    const res = makeRes();

    await googleCallback(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.cookie).not.toHaveBeenCalled();
  });

  test('7. New Google accounts are always created with role=tenant', async () => {
    getSupabaseUser.mockResolvedValue({
      id: 'supabase-admin-attempt-uuid',
      email: 'hacker@example.com',
      // Even if metadata contains admin role — must be ignored
      user_metadata: { full_name: 'Hacker', role: 'admin', is_admin: true },
    });

    mockUser.findOne = jest.fn().mockResolvedValue(null);
    const createdUser = makeUserInstance({ supabase_id: 'supabase-admin-attempt-uuid', role: 'tenant' });
    mockUser.create = jest.fn().mockResolvedValue(createdUser);

    const req = makeReq({ access_token: 'valid-token' });
    const res = makeRes();

    await googleCallback(req, res, next);

    // Role MUST be 'tenant' regardless of metadata
    expect(mockUser.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'tenant' })
    );
    expect(mockUser.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin' })
    );
    expect(mockUser.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ role: 'superadmin' })
    );
  });

  test('8. Response user object never contains a password field', async () => {
    getSupabaseUser.mockResolvedValue({
      id: 'supabase-safe-uuid',
      email: 'safe@example.com',
      user_metadata: { full_name: 'Safe User' },
    });

    const user = makeUserInstance({ supabase_id: 'supabase-safe-uuid' });
    mockUser.findOne = jest.fn().mockResolvedValue(user);

    const req = makeReq({ access_token: 'valid-token' });
    const res = makeRes();

    await googleCallback(req, res, next);

    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.user).not.toHaveProperty('password');
  });

});
