'use strict';

const { Op } = require('sequelize');
const { PaymentConfig, Payment, User } = require('../models');

// ---------------------------------------------------------------------------
// Helper: generate slug from purpose
// ---------------------------------------------------------------------------
function toSlug(str) {
  return str.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// ---------------------------------------------------------------------------
// GET /api/payment-configs
// Admin only — list all payment configs, ordered by created_at DESC.
// ---------------------------------------------------------------------------
const getAllPaymentConfigs = async (req, res, next) => {
  try {
    const configs = await PaymentConfig.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['first_name', 'last_name'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({ status: 'success', configs });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/payment-configs
// Admin only — create a new payment config.
// ---------------------------------------------------------------------------
const createPaymentConfig = async (req, res, next) => {
  try {
    const { purpose, amount, description, is_active } = req.body;

    // Validation
    const errors = [];

    if (!purpose || typeof purpose !== 'string' || purpose.trim().length === 0) {
      errors.push('Purpose is required.');
    } else if (purpose.trim().length > 100) {
      errors.push('Purpose must be 100 characters or fewer.');
    }

    const parsedAmount = parseFloat(amount);
    if (amount === undefined || amount === null || amount === '') {
      errors.push('Amount is required.');
    } else if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.push('Amount must be a positive number.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: errors.join(' '), errors });
    }

    const slug = toSlug(purpose.trim());

    // Check slug uniqueness
    const existing = await PaymentConfig.findOne({ where: { slug } });
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'A payment configuration with this purpose already exists.',
      });
    }

    const config = await PaymentConfig.create({
      purpose: purpose.trim(),
      slug,
      amount: parsedAmount,
      description: description ? description.trim() : null,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      created_by: req.user.id,
    });

    return res.status(201).json({ status: 'success', config });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        status: 'error',
        message: 'A payment configuration with this purpose or slug already exists.',
      });
    }
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/payment-configs/:id
// Admin only — update an existing payment config.
// ---------------------------------------------------------------------------
const updatePaymentConfig = async (req, res, next) => {
  try {
    const config = await PaymentConfig.findByPk(req.params.id);

    if (!config) {
      return res.status(404).json({ status: 'error', message: 'Payment configuration not found.' });
    }

    const { purpose, amount, description, is_active } = req.body;
    const updates = {};

    if (purpose !== undefined) {
      if (typeof purpose !== 'string' || purpose.trim().length === 0) {
        return res.status(400).json({ status: 'error', message: 'Purpose must be a non-empty string.' });
      }
      if (purpose.trim().length > 100) {
        return res.status(400).json({ status: 'error', message: 'Purpose must be 100 characters or fewer.' });
      }
      updates.purpose = purpose.trim();
      const newSlug = toSlug(purpose.trim());

      // Check uniqueness excluding current record
      const clash = await PaymentConfig.findOne({
        where: { slug: newSlug, id: { [Op.ne]: config.id } },
      });
      if (clash) {
        return res.status(409).json({
          status: 'error',
          message: 'Another payment configuration with this purpose already exists.',
        });
      }
      updates.slug = newSlug;
    }

    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ status: 'error', message: 'Amount must be a positive number.' });
      }
      updates.amount = parsedAmount;
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ status: 'error', message: 'No valid fields provided to update.' });
    }

    await config.update(updates);

    return res.status(200).json({ status: 'success', config });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        status: 'error',
        message: 'A payment configuration with this purpose or slug already exists.',
      });
    }
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/payment-configs/:id
// Admin only — delete a config (only if no payments reference it).
// ---------------------------------------------------------------------------
const deletePaymentConfig = async (req, res, next) => {
  try {
    const config = await PaymentConfig.findByPk(req.params.id);

    if (!config) {
      return res.status(404).json({ status: 'error', message: 'Payment configuration not found.' });
    }

    // Check for associated payments
    const paymentCount = await Payment.count({ where: { payment_config_id: config.id } });
    if (paymentCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete a payment configuration that has associated payments. Deactivate it instead.',
      });
    }

    await config.destroy();

    return res.status(200).json({ status: 'success', message: 'Payment configuration deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllPaymentConfigs, createPaymentConfig, updatePaymentConfig, deletePaymentConfig };
