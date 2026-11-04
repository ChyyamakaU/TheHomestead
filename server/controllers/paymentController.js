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
};
