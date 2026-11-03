'use strict';

const { Op } = require('sequelize');
const { Application, Apartment } = require('../models');

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

    // --- Create the application ---
    const application = await Application.create({
      apartment_id:          apartment.id,
      apartment_title:       apartment.title,
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
    const [total, pending, under_review, approved, rejected] = await Promise.all([
      Application.count(),
      Application.count({ where: { status: 'pending' } }),
      Application.count({ where: { status: 'under_review' } }),
      Application.count({ where: { status: 'approved' } }),
      Application.count({ where: { status: 'rejected' } }),
    ]);

    return res.status(200).json({
      status: 'success',
      stats: { total, pending, under_review, approved, rejected },
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
// ---------------------------------------------------------------------------
const updateApplication = async (req, res, next) => {
  try {
    const application = await Application.findByPk(req.params.id);

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found.',
      });
    }

    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];

    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.`,
      });
    }

    const updates = {};
    if (status !== undefined)      updates.status      = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields provided to update.',
      });
    }

    await application.update(updates);

    return res.status(200).json({
      status:      'success',
      message:     'Application updated successfully.',
      application,
    });
  } catch (error) {
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
};
