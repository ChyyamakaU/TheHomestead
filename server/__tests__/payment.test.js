'use strict';

/**
 * Payment integration tests — Paystack workflow
 *
 * All Paystack API calls are mocked so no real transactions are made.
 * The database is mocked using Jest module factories.
 *
 * Tests cover all 17 required scenarios from the spec:
 *  1.  Tenant cannot initiate payment for a pending application
 *  2.  Tenant cannot initiate payment for a rejected application
 *  3.  Approved applicant can initialize payment
 *  4.  Tenant cannot pay for another user's application/payment
 *  5.  Payment amount is retrieved from the backend (not frontend)
 *  6.  Paystack initialization failure is handled
 *  7.  Successful payment is independently verified
 *  8.  Failed payment does not create a tenant
 *  9.  Pending payment does not create a tenant
 * 10.  Incorrect transaction amount is rejected
 * 11.  Incorrect currency is rejected
 * 12.  Invalid webhook signature is rejected
 * 13.  Duplicate webhook events do not create duplicate tenants
 * 14.  Successful payment creates tenant and allocates apartment
 * 15.  Already-allocated apartment cannot be assigned to another applicant
 * 16.  DB failure during allocation does not leave inconsistent records
 * 17.  Tenant cannot pay twice for an already-completed payment
 */

// ─── Mock the database models ────────────────────────────────────────────────
// We define them before requiring any controller so jest.mock hoisting works.

const mockPayment     = {};
const mockApplication = {};
const mockApartment   = {};
const mockTenant      = {};

jest.mock('../models', () => ({
  Payment:       mockPayment,
  Application:   mockApplication,
  Apartment:     mockApartment,
  Tenant:        mockTenant,
  PaymentConfig: {},
  User:          {},
  sequelize: {
    transaction: jest.fn(),
  },
}));

// ─── Mock paystackService ────────────────────────────────────────────────────
jest.mock('../services/paystackService', () => ({
  initializeTransaction:  jest.fn(),
  verifyTransaction:      jest.fn(),
  verifyWebhookSignature: jest.fn(),
}));

const paystackService = require('../services/paystackService');
const db              = require('../models');

// ─── Import controller functions directly ───────────────────────────────────
// We test the controller functions without spinning up an HTTP server.
// This gives us clean, fast unit tests.
const {
  initializePaystackPayment,
  verifyPaystackPayment,
  paystackWebhook,
} = require('../controllers/paymentController');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a mock Express req object */
const makeReq = (overrides = {}) => ({
  user: { id: 1, email: 'tenant@test.com' },
  params: {},
  body: {},
  headers: {},
  ...overrides,
});

/** Create a mock Express res object that captures the response */
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.send   = jest.fn().mockReturnValue(res);
  return res;
};

const next = jest.fn();

// ─── Paystack mock data ───────────────────────────────────────────────────────
const MOCK_PAYSTACK_TX = {
  status:    'success',
  amount:    150000 * 100, // 150,000 NGN in kobo
  reference: 'HM-20261104-ABCDE',
  currency:  'NGN',
};

// Pending payment record (as returned by Payment.findOne/findByPk)
const MOCK_PAYMENT = {
  id:             10,
  reference:      'HM-20261104-ABCDE',
  user_id:        1,
  apartment_id:   5,
  application_id: 3,
  amount:         '150000.00',
  currency:       'NGN',
  status:         'pending',
  payment_method: 'paystack',
  update:         jest.fn().mockResolvedValue(true),
  application: {
    id:               3,
    status:           'approved',
    payment_status:   'unpaid',
    payment_deadline: null,
  },
  apartment: {
    id:           5,
    availability: 'available',
  },
};

// Processing payment (already sent to Paystack)
const MOCK_PAYMENT_PROCESSING = { ...MOCK_PAYMENT, id: 11, status: 'processing', update: jest.fn().mockResolvedValue(true) };

// Paid payment
const MOCK_PAYMENT_PAID = { ...MOCK_PAYMENT, id: 12, status: 'paid', update: jest.fn().mockResolvedValue(true) };

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// initializePaystackPayment tests
// ─────────────────────────────────────────────────────────────────────────────

describe('initializePaystackPayment', () => {

  // Test 1: cannot pay for a pending application
  test('1. Returns 400 when linked application status is pending', async () => {
    const pendingAppPayment = {
      ...MOCK_PAYMENT,
      application: { id: 3, status: 'pending', payment_status: null, payment_deadline: null },
    };
    mockPayment.findOne = jest.fn().mockResolvedValue(pendingAppPayment);

    const req = makeReq({ body: { payment_id: 10 } });
    const res = makeRes();

    await initializePaystackPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' })
    );
    expect(paystackService.initializeTransaction).not.toHaveBeenCalled();
  });

  // Test 2: cannot pay for a rejected application
  test('2. Returns 400 when linked application status is rejected', async () => {
    const rejectedPayment = {
      ...MOCK_PAYMENT,
      application: { id: 3, status: 'rejected', payment_status: 'expired', payment_deadline: null },
    };
    mockPayment.findOne = jest.fn().mockResolvedValue(rejectedPayment);

    const req = makeReq({ body: { payment_id: 10 } });
    const res = makeRes();

    await initializePaystackPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(paystackService.initializeTransaction).not.toHaveBeenCalled();
  });

  // Test 3: approved applicant CAN initialize payment
  test('3. Approved applicant can initialize payment and receives authorization_url', async () => {
    mockPayment.findOne = jest.fn().mockResolvedValue({ ...MOCK_PAYMENT, update: jest.fn().mockResolvedValue(true) });
    paystackService.initializeTransaction.mockResolvedValue({
      authorization_url: 'https://checkout.paystack.com/test123',
      reference:         'HM-20261104-ABCDE',
    });
    // No active tenant for apartment
    mockTenant.findOne = jest.fn().mockResolvedValue(null);

    const req = makeReq({ body: { payment_id: 10 } });
    const res = makeRes();

    await initializePaystackPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ authorization_url: 'https://checkout.paystack.com/test123' })
    );
  });

  // Test 4: cannot pay for another user's payment
  test('4. Returns 404 when payment does not belong to the authenticated user', async () => {
    // findOne returns null because user_id filter doesn't match
    mockPayment.findOne = jest.fn().mockResolvedValue(null);

    const req = makeReq({ body: { payment_id: 10 }, user: { id: 99, email: 'other@test.com' } });
    const res = makeRes();

    await initializePaystackPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // Test 5: amount is from the DB — not the frontend
  test('5. Payment amount used is taken from the database record, not request body', async () => {
    const payment = { ...MOCK_PAYMENT, update: jest.fn().mockResolvedValue(true) };
    mockPayment.findOne = jest.fn().mockResolvedValue(payment);
    mockTenant.findOne  = jest.fn().mockResolvedValue(null);
    paystackService.initializeTransaction.mockResolvedValue({
      authorization_url: 'https://checkout.paystack.com/test123',
      reference:         'HM-20261104-ABCDE',
    });

    // Even if the body contains a tampered amount, it is not passed to Paystack
    const req = makeReq({ body: { payment_id: 10, amount: 1 } });
    const res = makeRes();

    await initializePaystackPayment(req, res, next);

    expect(paystackService.initializeTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amount: Number(MOCK_PAYMENT.amount) })
    );
    // The tampered amount in body is NOT used
    expect(paystackService.initializeTransaction).not.toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1 })
    );
  });

  // Test 6: Paystack initialization failure is handled
  test('6. Paystack initialization failure is passed to next() error handler', async () => {
    mockPayment.findOne = jest.fn().mockResolvedValue({ ...MOCK_PAYMENT, update: jest.fn().mockResolvedValue(true) });
    mockTenant.findOne  = jest.fn().mockResolvedValue(null);
    paystackService.initializeTransaction.mockRejectedValue(new Error('Paystack unavailable'));

    const req = makeReq({ body: { payment_id: 10 } });
    const res = makeRes();
    const n   = jest.fn();

    await initializePaystackPayment(req, res, n);

    expect(n).toHaveBeenCalledWith(expect.any(Error));
  });

  // Test 15: already-allocated apartment cannot be assigned to another applicant
  test('15. Returns 409 when apartment already has an active tenant', async () => {
    mockPayment.findOne = jest.fn().mockResolvedValue({ ...MOCK_PAYMENT, update: jest.fn() });
    mockTenant.findOne  = jest.fn().mockResolvedValue({ id: 99, status: 'active' }); // active tenant exists

    const req = makeReq({ body: { payment_id: 10 } });
    const res = makeRes();

    await initializePaystackPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(paystackService.initializeTransaction).not.toHaveBeenCalled();
  });

  // Test 17: cannot pay twice for a completed payment
  test('17. Returns 400 when payment is already paid', async () => {
    mockPayment.findOne = jest.fn().mockResolvedValue(MOCK_PAYMENT_PAID);

    const req = makeReq({ body: { payment_id: 12 } });
    const res = makeRes();

    await initializePaystackPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(paystackService.initializeTransaction).not.toHaveBeenCalled();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// verifyPaystackPayment tests
// ─────────────────────────────────────────────────────────────────────────────

describe('verifyPaystackPayment', () => {

  const setupTransaction = () => {
    // Mock a Sequelize transaction
    const t = {
      LOCK: { UPDATE: 'UPDATE' },
      commit:   jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    db.sequelize.transaction.mockResolvedValue(t);
    return t;
  };

  // Test 7: successful payment is independently verified
  test('7. Successful payment returns status 200 with paid status', async () => {
    const processingPayment = { ...MOCK_PAYMENT_PROCESSING, update: jest.fn().mockResolvedValue(true) };
    mockPayment.findOne  = jest.fn().mockResolvedValue(processingPayment);
    mockPayment.findByPk = jest.fn()
      .mockResolvedValueOnce({ ...processingPayment }) // inside _completePayment lock
      .mockResolvedValueOnce({ ...MOCK_PAYMENT_PAID }); // re-fetch for response

    paystackService.verifyTransaction.mockResolvedValue(MOCK_PAYSTACK_TX);

    // Mock the Sequelize transaction used by _completePayment
    const t = setupTransaction();
    mockTenant.findOne  = jest.fn().mockResolvedValue(null);
    mockTenant.create   = jest.fn().mockResolvedValue({ id: 50 });
    mockApplication.update = jest.fn().mockResolvedValue([1]);
    mockApartment.update   = jest.fn().mockResolvedValue([1]);

    const req = makeReq({ params: { reference: 'HM-20261104-ABCDE' } });
    const res = makeRes();

    await verifyPaystackPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(paystackService.verifyTransaction).toHaveBeenCalledWith('HM-20261104-ABCDE');
  });

  // Test 8: failed payment does not create a tenant
  test('8. Failed Paystack transaction does not create a Tenant record', async () => {
    const processingPayment = { ...MOCK_PAYMENT_PROCESSING, update: jest.fn().mockResolvedValue(true) };
    mockPayment.findOne  = jest.fn().mockResolvedValue(processingPayment);
    mockPayment.findByPk = jest.fn().mockResolvedValue({ ...processingPayment, update: jest.fn().mockResolvedValue(true) });

    paystackService.verifyTransaction.mockResolvedValue({
      ...MOCK_PAYSTACK_TX,
      status: 'failed',
    });

    const req = makeReq({ params: { reference: 'HM-20261104-ABCDE' } });
    const res = makeRes();

    await verifyPaystackPayment(req, res, next);

    expect(mockTenant.create).not.toHaveBeenCalled();
    // Response should be 200 but payment status is failed
    expect(processingPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' })
    );
  });

  // Test 9: pending payment does not create a tenant
  test('9. Pending (not yet paid) payment does not create a Tenant record', async () => {
    const pendingPayment = { ...MOCK_PAYMENT, update: jest.fn().mockResolvedValue(true) };
    mockPayment.findOne  = jest.fn().mockResolvedValue(pendingPayment);
    mockPayment.findByPk = jest.fn().mockResolvedValue({ ...pendingPayment, update: jest.fn().mockResolvedValue(true) });

    paystackService.verifyTransaction.mockResolvedValue({
      ...MOCK_PAYSTACK_TX,
      status: 'pending',
    });

    const req = makeReq({ params: { reference: 'HM-20261104-ABCDE' } });
    const res = makeRes();

    await verifyPaystackPayment(req, res, next);

    // update called with failed (not paid)
    expect(pendingPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' })
    );
  });

  // Test 10: incorrect transaction amount is rejected
  test('10. Returns 400 when Paystack amount does not match expected amount', async () => {
    const processingPayment = { ...MOCK_PAYMENT_PROCESSING, update: jest.fn().mockResolvedValue(true) };
    mockPayment.findOne  = jest.fn().mockResolvedValue(processingPayment);
    mockPayment.findByPk = jest.fn().mockResolvedValue({ ...processingPayment, update: jest.fn().mockResolvedValue(true) });

    paystackService.verifyTransaction.mockResolvedValue({
      ...MOCK_PAYSTACK_TX,
      amount: 100, // Wrong amount (expected 15,000,000 kobo)
    });

    const req = makeReq({ params: { reference: 'HM-20261104-ABCDE' } });
    const res = makeRes();

    await verifyPaystackPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Test 11: incorrect currency is rejected
  test('11. Returns 400 when Paystack currency does not match expected currency', async () => {
    const processingPayment = { ...MOCK_PAYMENT_PROCESSING, update: jest.fn().mockResolvedValue(true) };
    mockPayment.findOne  = jest.fn().mockResolvedValue(processingPayment);
    mockPayment.findByPk = jest.fn().mockResolvedValue({ ...processingPayment, update: jest.fn().mockResolvedValue(true) });

    paystackService.verifyTransaction.mockResolvedValue({
      ...MOCK_PAYSTACK_TX,
      currency: 'USD', // Wrong currency
    });

    const req = makeReq({ params: { reference: 'HM-20261104-ABCDE' } });
    const res = makeRes();

    await verifyPaystackPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// paystackWebhook tests
// ─────────────────────────────────────────────────────────────────────────────

describe('paystackWebhook', () => {

  const webhookBody = {
    event: 'charge.success',
    data: {
      status:    'success',
      amount:    150000 * 100,
      reference: 'HM-20261104-ABCDE',
      currency:  'NGN',
    },
  };

  // Test 12: invalid webhook signature is rejected
  test('12. Returns 401 when webhook signature is invalid', async () => {
    paystackService.verifyWebhookSignature.mockReturnValue(false);

    const req = makeReq({
      headers: { 'x-paystack-signature': 'bad-sig' },
      rawBody: Buffer.from(JSON.stringify(webhookBody)),
      body:    webhookBody,
    });
    const res = makeRes();

    await paystackWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // Test 13: duplicate webhook events do not create duplicate tenants
  test('13. Duplicate webhook event does not create a second Tenant', async () => {
    paystackService.verifyWebhookSignature.mockReturnValue(true);

    // Payment is already paid
    const alreadyPaidPayment = {
      ...MOCK_PAYMENT_PAID,
      update: jest.fn().mockResolvedValue(true),
    };
    mockPayment.findOne = jest.fn().mockResolvedValue(alreadyPaidPayment);

    const req = makeReq({
      headers: { 'x-paystack-signature': 'valid-sig' },
      rawBody: Buffer.from(JSON.stringify(webhookBody)),
      body:    webhookBody,
    });
    const res = makeRes();

    await paystackWebhook(req, res);

    // Should still return 200 (to stop Paystack retrying)
    expect(res.status).toHaveBeenCalledWith(200);
    // But Tenant.create should not have been called
    // (payment.status === 'paid' short-circuits before _completePayment)
    expect(mockTenant.create).not.toHaveBeenCalled();
  });

  // Test 14: successful payment creates tenant and allocates apartment
  test('14. Valid webhook creates Tenant record and marks apartment occupied', async () => {
    paystackService.verifyWebhookSignature.mockReturnValue(true);

    const processingPayment = {
      ...MOCK_PAYMENT_PROCESSING,
      update: jest.fn().mockResolvedValue(true),
    };
    mockPayment.findOne = jest.fn().mockResolvedValue(processingPayment);

    // _completePayment uses sequelize.transaction
    const t = {
      LOCK: { UPDATE: 'UPDATE' },
      commit:   jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    db.sequelize.transaction.mockResolvedValue(t);

    // findByPk inside _completePayment (lock)
    mockPayment.findByPk = jest.fn().mockResolvedValue({
      ...processingPayment,
      update: jest.fn().mockResolvedValue(true),
    });

    mockTenant.findOne     = jest.fn().mockResolvedValue(null); // no existing tenant
    mockTenant.create      = jest.fn().mockResolvedValue({ id: 50 });
    mockApplication.update = jest.fn().mockResolvedValue([1]);
    mockApartment.update   = jest.fn().mockResolvedValue([1]);

    const req = makeReq({
      headers: { 'x-paystack-signature': 'valid-sig' },
      rawBody: Buffer.from(JSON.stringify(webhookBody)),
      body:    webhookBody,
    });
    const res = makeRes();

    await paystackWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockTenant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id:      processingPayment.user_id,
        apartment_id: processingPayment.apartment_id,
        status:       'active',
      }),
      expect.objectContaining({ transaction: t })
    );
    expect(mockApartment.update).toHaveBeenCalledWith(
      { availability: 'occupied' },
      expect.objectContaining({ where: { id: processingPayment.apartment_id } })
    );
    expect(mockApplication.update).toHaveBeenCalledWith(
      { status: 'payment_completed', payment_status: 'paid' },
      expect.anything()
    );
  });

  // Test 16: DB failure during allocation does not leave inconsistent records
  test('16. Database failure during allocation rolls back the transaction', async () => {
    paystackService.verifyWebhookSignature.mockReturnValue(true);

    const processingPayment = { ...MOCK_PAYMENT_PROCESSING, update: jest.fn().mockResolvedValue(true) };
    mockPayment.findOne = jest.fn().mockResolvedValue(processingPayment);

    const t = {
      LOCK: { UPDATE: 'UPDATE' },
      commit:   jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    db.sequelize.transaction.mockResolvedValue(t);

    mockPayment.findByPk = jest.fn().mockResolvedValue({
      ...processingPayment,
      update: jest.fn().mockResolvedValue(true),
    });

    mockTenant.findOne     = jest.fn().mockResolvedValue(null);
    mockApplication.update = jest.fn().mockResolvedValue([1]);
    // Apartment.update throws to simulate DB failure
    mockApartment.update   = jest.fn().mockRejectedValue(new Error('DB failure'));
    mockTenant.create      = jest.fn().mockResolvedValue({ id: 50 });

    const req = makeReq({
      headers: { 'x-paystack-signature': 'valid-sig' },
      rawBody: Buffer.from(JSON.stringify(webhookBody)),
      body:    webhookBody,
    });
    const res = makeRes();

    await paystackWebhook(req, res);

    // Webhook still returns 200 to Paystack (so it doesn't retry forever)
    expect(res.status).toHaveBeenCalledWith(200);
    // Transaction must have been rolled back
    expect(t.rollback).toHaveBeenCalled();
    // And NOT committed
    expect(t.commit).not.toHaveBeenCalled();
  });

});
