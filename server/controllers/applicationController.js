'use strict';

const { Op } = require('sequelize');
const { Application, Apartment, Payment, PaymentConfig, sequelize } = require('../models');

// ---------------------------------------------------------------------------
// Validation helpers (same rules as viewing requests for consistency)
// ---------------------------------------------------------------------------

const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

const isValidDate = (dateStr) => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

const isFutureOrTodayDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

// ---------------------------------------------------------------------------
// POST /api/applications
// Public — no authentication required.
//
// Validates the form, confirms the apartment is published, snapshots
// the title, then saves the application.
// ---------------------------------------------------------------------------
const submitApplication = async (req, res, next) => {
  try {
    const {
      apartment_id,
      full_name,
      email,
      phone,
      intended_move_in_date,
      message,
    } = req.body;

    // --- Validation ---
    const errors = [];

    if (!apartment_id || isNaN(Number(apartment_id))) {
      errors.push('A valid apartment must be selected.');
    }
    if (!full_name || full_name.trim().length < 2) {
      errors.push('Full name is required (minimum 2 characters).');
    }
    if (!email || !isValidEmail(email.trim())) {
      errors.push('A valid email address is required (e.g. john@example.com).');
    }
    if (!phone || !isValidPhone(phone.trim())) {
      errors.push('A valid phone number is required.');
    }
    if (!intended_move_in_date || !isValidDate(intended_move_in_date)) {
      errors.push('A valid intended move-in date is required (YYYY-MM-DD).');
    } else if (!isFutureOrTodayDate(intended_move_in_date)) {
      errors.push('Intended move-in date must be today or a future date.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please correct the following errors.',
        errors,
      });
    }

    // --- Verify apartment exists and is published ---
    const apartment = await Apartment.findOne({
      where: { id: Number(apartment_id), status: 'published' },
    });

    if (!apartment) {
      return res.status(404).json({
        status: 'error',
        message: 'The selected apartment was not found or is no longer available.',
      });
    }

    // --- Prevent duplicate applications (authenticated users only) ---
    if (req.user) {
      const existing = await Application.findOne({
        where: { user_id: req.user.id, apartment_id: apartment.id },
      });
      if (existing) {
        return res.status(409).json({
          status: 'error',
          message: 'You have already submitted an application for this apartment.',
        });
      }
    }

    // --- Create the application ---
    const application = await Application.create({
      apartment_id:          apartment.id,
      apartment_title:       apartment.title,
      user_id:               req.user ? req.user.id : null, // attach if authenticated
      full_name:             full_name.trim(),
      email:                 email.trim().toLowerCase(),
      phone:                 phone.trim(),
      intended_move_in_date,
      message:               message ? message.trim() : null,
      status:                'pending',
    });

    return res.status(201).json({
      status:  'success',
      message: 'Your application has been submitted successfully. We will be in touch soon.',
      application: {
        id:                    application.id,
        apartment_title:       application.apartment_title,
        full_name:             application.full_name,
        intended_move_in_date: application.intended_move_in_date,
        status:                application.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/applications
// Admin only — paginated list with optional filters.
//
// Query params:
//   status       — pending | under_review | approved | rejected
//   search       — partial match on full_name, email, or apartment_title
//   apartment_id — filter by specific apartment
//   page         — default 1
//   limit        — default 20, max 100
// ---------------------------------------------------------------------------
const getAllApplications = async (req, res, next) => {
  try {
    const { status, search, apartment_id, page = 1, limit = 20 } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};

    if (status)       where.status       = status;
    if (apartment_id) where.apartment_id = Number(apartment_id);
    if (search && search.trim() !== '') {
      where[Op.or] = [
        { full_name:       { [Op.iLike]: `%${search.trim()}%` } },
        { email:           { [Op.iLike]: `%${search.trim()}%` } },
        { apartment_title: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const { count, rows: applications } = await Application.findAndCountAll({
      where,
      include: [
        {
          model:      Apartment,
          as:         'apartment',
          attributes: ['id', 'title', 'city', 'status', 'availability'],
          required:   false, // LEFT JOIN — include even if apartment was deleted
        },
      ],
      order:    [['created_at', 'DESC']],
      limit:    limitNum,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limitNum);

    return res.status(200).json({
      status: 'success',
      pagination: {
        total:       count,
        page:        pageNum,
        limit:       limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/applications/stats
// Admin only — counts by status for the dashboard overview.
// Must be defined before /:id in the routes file.
// ---------------------------------------------------------------------------
const getApplicationStats = async (req, res, next) => {
  try {
    const [total, pending, under_review, approved, rejected, payment_completed] = await Promise.all([
      Application.count(),
      Application.count({ where: { status: 'pending' } }),
      Application.count({ where: { status: 'under_review' } }),
      Application.count({ where: { status: 'approved' } }),
      Application.count({ where: { status: 'rejected' } }),
      Application.count({ where: { status: 'payment_completed' } }),
    ]);

    return res.status(200).json({
      status: 'success',
      stats: { total, pending, under_review, approved, rejected, payment_completed },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/applications/:id
// Admin only — single application with linked apartment data.
// ---------------------------------------------------------------------------
const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findByPk(req.params.id, {
      include: [
        {
          model:      Apartment,
          as:         'apartment',
          attributes: ['id', 'title', 'city', 'state', 'status', 'availability', 'price'],
          required:   false,
        },
      ],
    });

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found.',
      });
    }

    return res.status(200).json({ status: 'success', application });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/applications/:id
// Admin only — updates status and/or admin_notes.
// When status transitions to 'approved', creates a pending Payment record
// and sets payment_status = 'unpaid' so the applicant can pay via Paystack.
// ---------------------------------------------------------------------------
const updateApplication = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const application = await Application.findByPk(req.params.id, {
      include: [
        { model: Apartment, as: 'apartment', attributes: ['id', 'title', 'availability', 'price', 'payment_period'], required: false },
      ],
      transaction: t,
    });

    if (!application) {
      await t.rollback();
      return res.status(404).json({ status: 'error', message: 'Application not found.' });
    }

    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'payment_completed'];

    if (status !== undefined && !validStatuses.includes(status)) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.`,
      });
    }

    const updates = {};
    if (status !== undefined)      updates.status      = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    if (Object.keys(updates).length === 0) {
      await t.rollback();
      return res.status(400).json({ status: 'error', message: 'No valid fields provided to update.' });
    }

    const wasAlreadyApproved = application.status === 'approved';
    const isBeingApproved    = status === 'approved' && !wasAlreadyApproved;

    // ── On approval: create a pending payment obligation ─────────────────
    if (isBeingApproved) {
      // Must have a registered user to pay
      if (!application.user_id) {
        await t.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'This application is not linked to a registered user account and cannot be approved for online payment.',
        });
      }

      // Find the first active PaymentConfig to use as the payment template.
      // Admin should ensure a suitable config exists (e.g. "Rent Payment").
      const config = await PaymentConfig.findOne({
        where: { is_active: true },
        order: [['created_at', 'ASC']],
        transaction: t,
      });

      if (!config) {
        await t.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'No active payment configuration found. Please create a payment configuration in Payment Settings before approving applications.',
        });
      }

      // Check no active pending/processing payment already exists for this application
      const existingPayment = await Payment.findOne({
        where: {
          application_id: application.id,
          status: { [Op.in]: ['pending', 'processing', 'paid'] },
        },
        transaction: t,
      });

      if (!existingPayment) {
        // Generate reference — format: HM-YYYYMMDD-XXXXX
        const reference =
          'HM-' +
          new Date().toISOString().slice(0, 10).replace(/-/g, '') +
          '-' +
          Math.random().toString(36).toUpperCase().slice(2, 7);

        await Payment.create(
          {
            reference,
            user_id:          application.user_id,
            apartment_id:     application.apartment_id,
            application_id:   application.id,
            payment_config_id: config.id,
            purpose:          config.purpose,
            amount:           config.amount,
            currency:         config.currency || 'NGN',
            payment_method:   'paystack',
            status:           'pending',
          },
          { transaction: t }
        );
      }

      // Set approval timestamp, deadline (7 days), and payment_status
      const approvedAt = new Date();
      const deadline   = new Date(approvedAt);
      deadline.setDate(deadline.getDate() + 7);

      updates.approved_at      = approvedAt;
      updates.payment_deadline = deadline;
      updates.payment_status   = 'unpaid';
    }

    // ── On rejection: clear any pending payment and mark expired ─────────
    if (status === 'rejected' && application.payment_status === 'unpaid') {
      await Payment.update(
        { status: 'cancelled' },
        {
          where: { application_id: application.id, status: { [Op.in]: ['pending'] } },
          transaction: t,
        }
      );
      updates.payment_status = 'expired';
    }

    await application.update(updates, { transaction: t });
    await t.commit();

    // Re-fetch with associations for the response
    const updated = await Application.findByPk(application.id, {
      include: [
        { model: Apartment, as: 'apartment', attributes: ['id', 'title', 'city', 'state', 'status', 'availability', 'price'], required: false },
        { model: Payment, as: 'payments', attributes: ['id', 'reference', 'amount', 'currency', 'status', 'created_at'], required: false },
      ],
    });

    return res.status(200).json({ status: 'success', message: 'Application updated successfully.', application: updated });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/applications/:id
// Admin only — permanently removes an application record.
// ---------------------------------------------------------------------------
const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findByPk(req.params.id);

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found.',
      });
    }

    await application.destroy();

    return res.status(200).json({
      status:  'success',
      message: 'Application deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitApplication,
  getAllApplications,
  getApplicationStats,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getMyApplications,
  getMyApplicationById,
  getMyApplicationPayment,
  getApplicationPaymentAdmin,
};

// ---------------------------------------------------------------------------
// GET /api/applications/my
// Tenant only — returns the authenticated user's own applications,
// including any linked payment obligation so the dashboard can show Pay Now.
// ---------------------------------------------------------------------------
async function getMyApplications(req, res, next) {
  try {
    const applications = await Application.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Apartment,
          as: 'apartment',
          attributes: ['id', 'title', 'city', 'state', 'slug', 'availability'],
          required: false,
          include: [
            {
              model: require('../models').ApartmentImage,
              as: 'images',
              attributes: ['url', 'is_primary'],
              limit: 1,
              order: [['is_primary', 'DESC']],
            },
          ],
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'reference', 'amount', 'currency', 'purpose', 'status', 'payment_method', 'created_at'],
          required: false,
          where: { status: { [Op.in]: ['pending', 'processing', 'paid'] } },
          // Most recent first so we pick the active obligation
          order: [['created_at', 'DESC']],
          limit: 1,
          separate: true,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({ status: 'success', applications });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/applications/my/:id
// Tenant only — single application detail with linked payment.
// ---------------------------------------------------------------------------
async function getMyApplicationById(req, res, next) {
  try {
    const application = await Application.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        {
          model: Apartment,
          as: 'apartment',
          attributes: ['id', 'title', 'city', 'state', 'slug', 'price', 'payment_period', 'availability'],
          required: false,
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'reference', 'amount', 'currency', 'purpose', 'status', 'paystack_reference', 'verified_at', 'created_at'],
          required: false,
        },
      ],
    });

    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Application not found.' });
    }

    return res.status(200).json({ status: 'success', application });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/applications/my/:id/payment
// Tenant only — fetch the active payment obligation for one of their approved
// applications. Used by the Pay Now button on the dashboard.
// ---------------------------------------------------------------------------
async function getMyApplicationPayment(req, res, next) {
  try {
    const application = await Application.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      attributes: ['id', 'status', 'payment_status', 'payment_deadline', 'approved_at', 'apartment_title'],
    });

    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Application not found.' });
    }

    if (!['approved', 'payment_completed'].includes(application.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'This application has not been approved.',
      });
    }

    const payment = await Payment.findOne({
      where: {
        application_id: application.id,
        user_id: req.user.id,
        status: { [Op.in]: ['pending', 'processing', 'paid'] },
      },
      include: [
        {
          model: require('../models').PaymentConfig,
          as: 'paymentConfig',
          attributes: ['purpose', 'description'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({ status: 'success', application, payment: payment || null });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/applications/:id/payment
// Admin only — fetch the payment record for any application.
// ---------------------------------------------------------------------------
async function getApplicationPaymentAdmin(req, res, next) {
  try {
    const application = await Application.findByPk(req.params.id, {
      attributes: ['id', 'status', 'payment_status', 'payment_deadline', 'approved_at', 'apartment_title', 'full_name', 'email'],
    });

    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Application not found.' });
    }

    const payments = await Payment.findAll({
      where: { application_id: application.id },
      include: [
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({ status: 'success', application, payments });
  } catch (error) {
    next(error);
  }
}
