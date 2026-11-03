'use strict';

const { Op } = require('sequelize');
const { ViewingRequest, Apartment } = require('../models');

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const isValidEmail = (email) => {
  // Must start with letters, then optional letters/numbers, then @ and domain
  const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  // Accepts digits, spaces, hyphens, parentheses, and leading +
  // Minimum 7 digits, maximum 15 (E.164 standard)
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

const isValidDate = (dateStr) => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

const isFutureDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

// ---------------------------------------------------------------------------
// POST /api/viewing-requests
// Public — no authentication required.
//
// Validates the submission, verifies the apartment exists and is published,
// snapshots the apartment title, then saves the request.
// ---------------------------------------------------------------------------
const submitViewingRequest = async (req, res, next) => {
  try {
    const {
      apartment_id,
      full_name,
      email,
      phone,
      preferred_date,
      preferred_time,
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
    if (!preferred_date || !isValidDate(preferred_date)) {
      errors.push('A valid preferred viewing date is required (YYYY-MM-DD).');
    } else if (!isFutureDate(preferred_date)) {
      errors.push('Preferred viewing date must be today or a future date.');
    }
    if (!preferred_time || preferred_time.trim() === '') {
      errors.push('Preferred viewing time is required.');
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
      where: {
        id:     Number(apartment_id),
        status: 'published',
      },
    });

    if (!apartment) {
      return res.status(404).json({
        status: 'error',
        message: 'The selected apartment was not found or is no longer available.',
      });
    }

    // --- Create the viewing request ---
    const viewingRequest = await ViewingRequest.create({
      apartment_id:    apartment.id,
      apartment_title: apartment.title, // snapshot
      full_name:       full_name.trim(),
      email:           email.trim().toLowerCase(),
      phone:           phone.trim(),
      preferred_date,
      preferred_time:  preferred_time.trim(),
      message:         message ? message.trim() : null,
      status:          'pending',
    });

    return res.status(201).json({
      status: 'success',
      message: 'Your viewing request has been submitted successfully. We will contact you shortly to confirm.',
      viewingRequest: {
        id:              viewingRequest.id,
        apartment_title: viewingRequest.apartment_title,
        full_name:       viewingRequest.full_name,
        preferred_date:  viewingRequest.preferred_date,
        preferred_time:  viewingRequest.preferred_time,
        status:          viewingRequest.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/admin/viewing-requests
// Admin only — returns all viewing requests with optional filters.
//
// Query params:
//   status       — filter by status (pending | confirmed | completed | cancelled)
//   search       — partial match on full_name or email
//   apartment_id — filter by specific apartment
//   page         — pagination (default 1)
//   limit        — results per page (default 20)
// ---------------------------------------------------------------------------
const getAllViewingRequests = async (req, res, next) => {
  try {
    const { status, search, apartment_id, page = 1, limit = 20 } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};

    if (status) where.status = status;
    if (apartment_id) where.apartment_id = Number(apartment_id);
    if (search && search.trim() !== '') {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search.trim()}%` } },
        { email:     { [Op.iLike]: `%${search.trim()}%` } },
        { apartment_title: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const { count, rows: viewingRequests } = await ViewingRequest.findAndCountAll({
      where,
      include: [
        {
          model:      Apartment,
          as:         'apartment',
          attributes: ['id', 'title', 'city', 'status'],
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
      viewingRequests,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/admin/viewing-requests/:id
// Admin only — returns a single viewing request by ID.
// ---------------------------------------------------------------------------
const getViewingRequestById = async (req, res, next) => {
  try {
    const viewingRequest = await ViewingRequest.findByPk(req.params.id, {
      include: [
        {
          model:      Apartment,
          as:         'apartment',
          attributes: ['id', 'title', 'city', 'state', 'status', 'availability'],
          required:   false,
        },
      ],
    });

    if (!viewingRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Viewing request not found.',
      });
    }

    return res.status(200).json({ status: 'success', viewingRequest });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/admin/viewing-requests/:id
// Admin only — updates the status and/or admin_notes on a viewing request.
//
// Body: { status, admin_notes }
// Both fields are optional — only provided fields are updated.
// ---------------------------------------------------------------------------
const updateViewingRequest = async (req, res, next) => {
  try {
    const viewingRequest = await ViewingRequest.findByPk(req.params.id);

    if (!viewingRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Viewing request not found.',
      });
    }

    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

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

    await viewingRequest.update(updates);

    return res.status(200).json({
      status:  'success',
      message: 'Viewing request updated successfully.',
      viewingRequest,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/admin/viewing-requests/:id
// Admin only — permanently removes a viewing request record.
// ---------------------------------------------------------------------------
const deleteViewingRequest = async (req, res, next) => {
  try {
    const viewingRequest = await ViewingRequest.findByPk(req.params.id);

    if (!viewingRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Viewing request not found.',
      });
    }

    await viewingRequest.destroy();

    return res.status(200).json({
      status:  'success',
      message: 'Viewing request deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/admin/viewing-requests/stats
// Admin only — counts by status for the dashboard overview.
// ---------------------------------------------------------------------------
const getViewingRequestStats = async (req, res, next) => {
  try {
    const { sequelize } = require('../config/database');

    const [total, pending, confirmed, completed, cancelled] = await Promise.all([
      ViewingRequest.count(),
      ViewingRequest.count({ where: { status: 'pending' } }),
      ViewingRequest.count({ where: { status: 'confirmed' } }),
      ViewingRequest.count({ where: { status: 'completed' } }),
      ViewingRequest.count({ where: { status: 'cancelled' } }),
    ]);

    return res.status(200).json({
      status: 'success',
      stats: { total, pending, confirmed, completed, cancelled },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitViewingRequest,
  getAllViewingRequests,
  getViewingRequestById,
  updateViewingRequest,
  deleteViewingRequest,
  getViewingRequestStats,
};
