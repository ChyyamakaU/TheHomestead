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
// Tenant only — create a pending payment record and get a Paystack
// checkout URL. The secret key stays on the server.
// ---------------------------------------------------------------------------
async function initializePaystackPayment(req, res, next) {
  try {
    const { payment_config_id, apartment_id, application_id } = req.body;

    if (!payment_config_id) {
      return res.status(400).json({ status: 'error', message: 'payment_config_id is required.' });
    }

    const config = await PaymentConfig.findByPk(payment_config_id);
    if (!config || !config.is_active) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment configuration not found or inactive.',
      });
    }

    const reference = generateReference();

    // Create the payment record in a pending state BEFORE calling Paystack.
    // This gives us an idempotent record we can reconcile against the webhook.
    const payment = await Payment.create({
      reference,
      user_id: req.user.id,
      apartment_id: apartment_id || null,
      application_id: application_id || null,
      payment_config_id: config.id,
      purpose: config.purpose,
      amount: config.amount,
      currency: config.currency,
      payment_method: 'paystack',
      status: 'pending',
    });

    // Initialize the transaction on Paystack
    const { initializeTransaction } = require('../services/paystackService');
    const callbackUrl = `${process.env.CLIENT_URL}/dashboard/payments?ref=${reference}`;

    const txData = await initializeTransaction({
      email:        req.user.email,
      amount:       Number(config.amount),
      reference,
      callback_url: callbackUrl,
      metadata: {
        payment_id:   payment.id,
        purpose:      config.purpose,
        user_id:      req.user.id,
        apartment_id: apartment_id || null,
      },
    });

    // Update the payment record with Paystack's access code
    await payment.update({
      status: 'processing',
      paystack_reference: txData.reference,
    });

    return res.status(200).json({
      status: 'success',
      authorization_url: txData.authorization_url,
      reference,
      payment_id: payment.id,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/payments/paystack/verify/:reference
// Tenant only — verify a Paystack transaction after returning from checkout.
// Server-side only — we never trust the frontend's success signal alone.
// ---------------------------------------------------------------------------
async function verifyPaystackPayment(req, res, next) {
  try {
    const { reference } = req.params;

    // Find our payment record
    const payment = await Payment.findOne({
      where: { reference, user_id: req.user.id },
    });

    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found.' });
    }

    // Idempotency: if already paid, just return success
    if (payment.status === 'paid') {
      return res.status(200).json({ status: 'success', payment });
    }

    // Call Paystack to verify
    const { verifyTransaction } = require('../services/paystackService');
    const txData = await verifyTransaction(reference);

    // Amount check — Paystack returns amount in kobo, we store in NGN
    const expectedKobo = Math.round(Number(payment.amount) * 100);
    if (txData.amount !== expectedKobo) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment amount mismatch. Transaction cannot be verified.',
      });
    }

    if (txData.status === 'success') {
      await payment.update({
        status: 'paid',
        paystack_reference: txData.reference,
        paystack_data: txData,
        verified_at: new Date(),
      });

      await writeAuditLog({
        user_id: req.user.id,
        action: 'PAYSTACK_PAYMENT_VERIFIED',
        entity_type: 'Payment',
        entity_id: payment.id,
        old_value: { status: payment.status },
        new_value: { status: 'paid' },
      });
    } else {
      await payment.update({ status: 'failed', paystack_data: txData });
    }

    return res.status(200).json({ status: 'success', payment });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/payments/paystack/webhook
// Paystack webhook — receives payment event notifications.
//
// IMPORTANT: this route must use raw body parsing (see routes/payments.js).
// We verify the HMAC-SHA512 signature before processing anything.
// ---------------------------------------------------------------------------
async function paystackWebhook(req, res) {
  try {
    const signature = req.headers['x-paystack-signature'];
    const rawBody   = req.rawBody; // set by raw body middleware in routes

    const { verifyWebhookSignature } = require('../services/paystackService');

    if (!verifyWebhookSignature(rawBody, signature)) {
      // Reject silently — don't reveal what went wrong
      return res.status(401).send('Unauthorized');
    }

    const event = req.body;

    // We only handle charge.success events
    if (event.event === 'charge.success') {
      const txData    = event.data;
      const reference = txData.reference;

      const payment = await Payment.findOne({ where: { reference } });

      if (payment && payment.status !== 'paid') {
        const expectedKobo = Math.round(Number(payment.amount) * 100);

        if (txData.amount === expectedKobo && txData.status === 'success') {
          await payment.update({
            status: 'paid',
            paystack_reference: txData.reference,
            paystack_data: txData,
            verified_at: new Date(),
          });

          await writeAuditLog({
            user_id: payment.user_id,
            action: 'PAYSTACK_WEBHOOK_PAID',
            entity_type: 'Payment',
            entity_id: payment.id,
            old_value: { status: payment.status },
            new_value: { status: 'paid' },
          });
        }
      }
    }

    // Always return 200 to Paystack — otherwise they retry
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook error]', error.message);
    return res.status(200).json({ received: true }); // still 200 to stop retries
  }
}
