'use strict';

const { Op } = require('sequelize');
const { Payment, PaymentConfig, User, Apartment, Application } = require('../models');

// ---------------------------------------------------------------------------
// Helper: generate unique payment reference
// Format: HM-20261104-A3F9B
// ---------------------------------------------------------------------------
function generateReference() {
  return (
    'HM-' +
    new Date().toISOString().slice(0, 10).replace(/-/g, '') +
    '-' +
    Math.random().toString(36).toUpperCase().slice(2, 7)
  );
}

// ---------------------------------------------------------------------------
// Helper: write audit log entry (non-blocking, won't crash if model absent)
// ---------------------------------------------------------------------------
async function writeAuditLog(entry) {
  try {
    const db = require('../models');
    if (db.AuditLog) {
      await db.AuditLog.create(entry);
    } else {
      console.log('[AuditLog]', JSON.stringify(entry));
    }
  } catch (err) {
    console.error('[AuditLog error]', err.message);
  }
}

// ---------------------------------------------------------------------------
// POST /api/payments/cash
// Tenant only — initiate a cash payment from a config.
// ---------------------------------------------------------------------------
const initiateCashPayment = async (req, res, next) => {
  try {
    const { payment_config_id, apartment_id, application_id, notes } = req.body;

    if (!payment_config_id) {
      return res.status(400).json({
        status: 'error',
        message: 'payment_config_id is required.',
      });
    }

    // Fetch the config — must exist and be active
    const config = await PaymentConfig.findByPk(payment_config_id);
    if (!config) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment configuration not found.',
      });
    }
    if (!config.is_active) {
      return res.status(400).json({
        status: 'error',
        message: 'This payment configuration is not currently active.',
      });
    }

    const reference = generateReference();

    const payment = await Payment.create({
      reference,
      user_id: req.user.id,
      apartment_id: apartment_id || null,
      application_id: application_id || null,
      payment_config_id: config.id,
      purpose: config.purpose,
      amount: config.amount,
      currency: config.currency,
      payment_method: 'cash',
      status: 'pending',
      notes: notes ? notes.trim() : null,
    });

    return res.status(201).json({ status: 'success', payment });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/payments/my
// Tenant only — return all payments for the authenticated user.
// ---------------------------------------------------------------------------
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: PaymentConfig,
          as: 'paymentConfig',
          attributes: ['purpose', 'slug'],
          required: false,
        },
        {
          model: Apartment,
          as: 'apartment',
          attributes: ['title', 'city', 'slug'],
          required: false,
        },
        {
          model: Application,
          as: 'application',
          attributes: ['id', 'status'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({ status: 'success', payments });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/payments/my/:id
// Tenant only — single payment detail, ownership enforced.
// ---------------------------------------------------------------------------
const getMyPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        {
          model: PaymentConfig,
          as: 'paymentConfig',
          attributes: ['purpose', 'slug'],
          required: false,
        },
        {
          model: Apartment,
          as: 'apartment',
          attributes: ['title', 'city', 'slug'],
          required: false,
        },
        {
          model: Application,
          as: 'application',
          attributes: ['id', 'status'],
          required: false,
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found.' });
    }

    return res.status(200).json({ status: 'success', payment });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/payments
// Admin only — paginated list with optional filters.
// ---------------------------------------------------------------------------
const getAllPayments = async (req, res, next) => {
  try {
    const { status, payment_method, payment_config_id, page = 1, limit = 20 } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};
    if (status)             where.status             = status;
    if (payment_method)     where.payment_method     = payment_method;
    if (payment_config_id)  where.payment_config_id  = Number(payment_config_id);

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email'],
          required: false,
        },
        {
          model: PaymentConfig,
          as: 'paymentConfig',
          attributes: ['purpose', 'slug'],
          required: false,
        },
        {
          model: Apartment,
          as: 'apartment',
          attributes: ['id', 'title', 'city', 'slug'],
          required: false,
        },
        {
          model: Application,
          as: 'application',
          attributes: ['id', 'status'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limitNum);

    return res.status(200).json({
      status: 'success',
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/payments/:id
// Admin only — full payment detail.
// ---------------------------------------------------------------------------
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false,
        },
        {
          model: PaymentConfig,
          as: 'paymentConfig',
          required: false,
        },
        {
          model: Apartment,
          as: 'apartment',
          attributes: ['id', 'title', 'city', 'slug'],
          required: false,
        },
        {
          model: Application,
          as: 'application',
          attributes: ['id', 'status'],
          required: false,
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found.' });
    }

    return res.status(200).json({ status: 'success', payment });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/payments/:id/verify
// Admin only — verify a pending cash payment.
// ---------------------------------------------------------------------------
const verifyCashPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found.' });
    }

    if (payment.payment_method !== 'cash') {
      return res.status(400).json({
        status: 'error',
        message: 'Only cash payments can be manually verified.',
      });
    }

    if (!['pending', 'processing'].includes(payment.status)) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot verify a payment with status '${payment.status}'. Only pending or processing payments can be verified.`,
      });
    }

    const oldStatus = payment.status;
    const { notes } = req.body;

    await payment.update({
      status: 'paid',
      verified_by: req.user.id,
      verified_at: new Date(),
      ...(notes !== undefined && { notes: notes.trim() }),
    });

    // Audit log (non-blocking)
    await writeAuditLog({
      user_id: req.user.id,
      action: 'CASH_PAYMENT_VERIFIED',
      entity_type: 'Payment',
      entity_id: payment.id,
      old_value: { status: oldStatus },
      new_value: { status: 'paid' },
    });

    return res.status(200).json({ status: 'success', payment });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/payments/:id/cancel
// Admin only — cancel a pending or processing payment.
// ---------------------------------------------------------------------------
const cancelPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found.' });
    }

    if (!['pending', 'processing'].includes(payment.status)) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot cancel a payment with status '${payment.status}'. Only pending or processing payments can be cancelled.`,
      });
    }

    const oldStatus = payment.status;

    await payment.update({ status: 'cancelled' });

    // Audit log (non-blocking)
    await writeAuditLog({
      user_id: req.user.id,
      action: 'PAYMENT_CANCELLED',
      entity_type: 'Payment',
      entity_id: payment.id,
      old_value: { status: oldStatus },
      new_value: { status: 'cancelled' },
    });

    return res.status(200).json({ status: 'success', payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateReference,
  initiateCashPayment,
  getMyPayments,
  getMyPaymentById,
  getAllPayments,
  getPaymentById,
  verifyCashPayment,
  cancelPayment,
  initializePaystackPayment,
  verifyPaystackPayment,
  paystackWebhook,
  getPaymentStats,
};

// ---------------------------------------------------------------------------
// GET /api/payments/stats  — Admin only
// ---------------------------------------------------------------------------
async function getPaymentStats(req, res, next) {
  try {
    const [total, pending, paid, failed, cash, paystack] = await Promise.all([
      Payment.count(),
      Payment.count({ where: { status: 'pending' } }),
      Payment.count({ where: { status: 'paid' } }),
      Payment.count({ where: { status: 'failed' } }),
      Payment.count({ where: { payment_method: 'cash' } }),
      Payment.count({ where: { payment_method: 'paystack' } }),
    ]);

    // Total revenue from paid payments
    const revenue = await Payment.sum('amount', { where: { status: 'paid' } });

    return res.status(200).json({
      status: 'success',
      stats: { total, pending, paid, failed, cash, paystack, revenue: revenue || 0 },
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/payments/paystack/initialize
// Tenant only — initialize Paystack payment for an approved application.
//
// The frontend sends { payment_id } — the ID of the pending Payment record
// that was created when the admin approved the application.
// We NEVER accept amounts from the frontend; everything comes from the DB.
// ---------------------------------------------------------------------------
async function initializePaystackPayment(req, res, next) {
  try {
    const { payment_id } = req.body;

    if (!payment_id) {
      return res.status(400).json({ status: 'error', message: 'payment_id is required.' });
    }

    // Fetch the payment record — must belong to this user
    const payment = await Payment.findOne({
      where: { id: payment_id, user_id: req.user.id },
      include: [
        {
          model: Application,
          as: 'application',
          attributes: ['id', 'status', 'payment_status', 'payment_deadline'],
          required: false,
        },
        {
          model: Apartment,
          as: 'apartment',
          attributes: ['id', 'availability'],
          required: false,
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment record not found.' });
    }

    // Validate payment state
    if (payment.status === 'paid') {
      return res.status(400).json({ status: 'error', message: 'This payment has already been completed.' });
    }

    if (!['pending', 'processing'].includes(payment.status)) {
      return res.status(400).json({
        status: 'error',
        message: `Payment cannot be initialized from status '${payment.status}'.`,
      });
    }

    // Validate the linked application
    const app = payment.application;
    if (!app) {
      return res.status(400).json({ status: 'error', message: 'No application linked to this payment.' });
    }
    if (app.status !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'The linked application has not been approved.',
      });
    }
    if (app.payment_status === 'paid') {
      return res.status(400).json({ status: 'error', message: 'This application has already been paid.' });
    }

    // Check payment deadline
    if (app.payment_deadline && new Date() > new Date(app.payment_deadline)) {
      return res.status(400).json({ status: 'error', message: 'The payment deadline for this application has passed.' });
    }

    // Check the apartment hasn't been allocated to another active tenant
    if (payment.apartment_id) {
      const { Tenant } = require('../models');
      const activeTenant = await Tenant.findOne({
        where: { apartment_id: payment.apartment_id, status: 'active' },
      });
      if (activeTenant) {
        return res.status(409).json({
          status: 'error',
          message: 'This apartment has already been allocated to another tenant.',
        });
      }
    }

    // Initialize the transaction on Paystack
    const { initializeTransaction } = require('../services/paystackService');
    const callbackUrl = `${process.env.CLIENT_URL}/dashboard/payments?ref=${payment.reference}`;

    const txData = await initializeTransaction({
      email:        req.user.email,
      amount:       Number(payment.amount), // service converts NGN → kobo
      reference:    payment.reference,
      callback_url: callbackUrl,
      metadata: {
        payment_id:     payment.id,
        purpose:        payment.purpose,
        user_id:        req.user.id,
        apartment_id:   payment.apartment_id || null,
        application_id: payment.application_id || null,
      },
    });

    // Mark as processing so the user can't double-initialize
    await payment.update({
      status: 'processing',
      paystack_reference: txData.reference,
    });

    return res.status(200).json({
      status: 'success',
      authorization_url: txData.authorization_url,
      reference: payment.reference,
      payment_id: payment.id,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/payments/paystack/verify/:reference
// Tenant only — verify a Paystack transaction after returning from checkout.
// Server-side only — we never trust the frontend success signal alone.
// On success, creates the tenant record and allocates the apartment.
// ---------------------------------------------------------------------------
async function verifyPaystackPayment(req, res, next) {
  try {
    const { reference } = req.params;

    const payment = await Payment.findOne({
      where: { reference, user_id: req.user.id },
    });

    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found.' });
    }

    // Idempotency: already paid
    if (payment.status === 'paid') {
      return res.status(200).json({ status: 'success', payment });
    }

    // Call Paystack to verify
    const { verifyTransaction } = require('../services/paystackService');
    const txData = await verifyTransaction(reference);

    // Amount check — Paystack returns amount in kobo, we store NGN
    const expectedKobo = Math.round(Number(payment.amount) * 100);
    if (txData.amount !== expectedKobo) {
      await payment.update({ status: 'failed', paystack_data: txData });
      return res.status(400).json({
        status: 'error',
        message: 'Payment amount mismatch. Transaction cannot be verified.',
      });
    }

    // Currency check
    if (txData.currency && txData.currency !== payment.currency) {
      await payment.update({ status: 'failed', paystack_data: txData });
      return res.status(400).json({
        status: 'error',
        message: 'Currency mismatch. Transaction cannot be verified.',
      });
    }

    if (txData.status === 'success') {
      await _completePayment(payment, txData);
    } else {
      await payment.update({ status: 'failed', paystack_data: txData });
    }

    // Re-fetch for response
    const updated = await Payment.findByPk(payment.id);
    return res.status(200).json({ status: 'success', payment: updated });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/payments/paystack/webhook
// Paystack webhook — receives payment event notifications.
// Uses raw body for HMAC signature verification (see routes/payments.js).
// Idempotent — safe to call multiple times for the same transaction.
// ---------------------------------------------------------------------------
async function paystackWebhook(req, res) {
  try {
    const signature = req.headers['x-paystack-signature'];
    const rawBody   = req.rawBody;

    const { verifyWebhookSignature } = require('../services/paystackService');

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).send('Unauthorized');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const txData    = event.data;
      const reference = txData.reference;

      const payment = await Payment.findOne({ where: { reference } });

      if (payment && payment.status !== 'paid') {
        const expectedKobo = Math.round(Number(payment.amount) * 100);

        if (
          txData.amount === expectedKobo &&
          txData.status === 'success' &&
          (!txData.currency || txData.currency === payment.currency)
        ) {
          await _completePayment(payment, txData);
        }
      }
    }

    // Always 200 to Paystack to stop retries
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook error]', error.message);
    return res.status(200).json({ received: true });
  }
}

// ---------------------------------------------------------------------------
// _completePayment — internal helper
// Called by both verifyPaystackPayment and paystackWebhook after confirming
// a payment is genuine. Runs everything in a Sequelize transaction:
//  1. Marks Payment as paid
//  2. Marks Application as payment_completed / payment_status paid
//  3. Creates Tenant record
//  4. Sets Apartment availability to occupied
// Idempotent — checks for an existing Tenant before creating one.
// ---------------------------------------------------------------------------
async function _completePayment(payment, txData) {
  const { sequelize, Application, Apartment, Tenant } = require('../models');

  const t = await sequelize.transaction();
  try {
    // Re-fetch payment inside transaction with a row-level lock
    const p = await Payment.findByPk(payment.id, { transaction: t, lock: t.LOCK.UPDATE });

    // Idempotency guard — another process already completed this
    if (p.status === 'paid') {
      await t.rollback();
      return;
    }

    // Check if a tenant was already created for this application
    if (p.application_id) {
      const existingTenant = await Tenant.findOne({
        where: { application_id: p.application_id },
        transaction: t,
      });
      if (existingTenant) {
        // Already allocated — just mark payment paid if not yet done
        if (p.status !== 'paid') {
          await p.update({ status: 'paid', paystack_reference: txData.reference, paystack_data: txData, verified_at: new Date() }, { transaction: t });
        }
        await t.commit();
        return;
      }
    }

    // 1. Update Payment
    await p.update(
      {
        status: 'paid',
        paystack_reference: txData.reference,
        paystack_data: txData,
        verified_at: new Date(),
      },
      { transaction: t }
    );

    // 2. Update Application
    if (p.application_id) {
      await Application.update(
        { status: 'payment_completed', payment_status: 'paid' },
        { where: { id: p.application_id }, transaction: t }
      );
    }

    // 3. Create Tenant record
    const startDate = new Date().toISOString().slice(0, 10);
    await Tenant.create(
      {
        user_id:        p.user_id,
        apartment_id:   p.apartment_id || null,
        application_id: p.application_id || null,
        payment_id:     p.id,
        status:         'active',
        start_date:     startDate,
      },
      { transaction: t }
    );

    // 4. Update Apartment availability
    if (p.apartment_id) {
      await Apartment.update(
        { availability: 'occupied' },
        { where: { id: p.apartment_id }, transaction: t }
      );
    }

    await t.commit();

    // Audit log (non-blocking, outside transaction)
    await writeAuditLog({
      user_id:     p.user_id,
      action:      'PAYMENT_COMPLETED_TENANT_CREATED',
      entity_type: 'Payment',
      entity_id:   p.id,
      old_value:   { status: payment.status },
      new_value:   { status: 'paid', tenant_created: true },
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
