'use strict';

const { Op } = require('sequelize');
const { Apartment, Amenity, ApartmentImage } = require('../models');

// ---------------------------------------------------------------------------
// Standard include block for public responses.
// Always returns amenities and images alongside each apartment.
// Images are ordered by display_order so the primary image is predictably first.
// ---------------------------------------------------------------------------
const publicInclude = [
  {
    model: Amenity,
    as: 'amenities',
    attributes: ['id', 'name'],
    through: { attributes: [] }, // exclude junction table fields
  },
  {
    model: ApartmentImage,
    as: 'images',
    attributes: ['id', 'url', 'is_primary', 'display_order'],
    order: [['display_order', 'ASC']],
  },
];

// ---------------------------------------------------------------------------
// Base where clause for all public queries.
// Public endpoints ONLY show published apartments.
// The availability filter is separate (visitors can still view occupied
// apartments to see what exists — they just cannot apply for them).
// ---------------------------------------------------------------------------
const publicBaseWhere = {
  status: 'published',
};

// ---------------------------------------------------------------------------
// GET /api/public/apartments
//
// Returns a paginated list of published apartments.
//
// Query parameters:
//   page          {number}  Page number, default 1
//   limit         {number}  Results per page, default 9, max 50
//   city          {string}  Filter by city (partial match, case-insensitive)
//   state         {string}  Filter by state (partial match)
//   apartment_type{string}  Filter by type (partial match)
//   bedrooms      {number}  Exact number of bedrooms
//   min_price     {number}  Minimum rental price
//   max_price     {number}  Maximum rental price
//   availability  {string}  available | occupied | unavailable
//   search        {string}  Full-text search across title, city, state, description
// ---------------------------------------------------------------------------
const getPublicApartments = async (req, res, next) => {
  try {
    const {
      page       = 1,
      limit      = 9,
      city,
      state,
      apartment_type,
      bedrooms,
      min_price,
      max_price,
      availability,
      search,
    } = req.query;

    // Sanitise pagination values
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 9));
    const offset   = (pageNum - 1) * limitNum;

    // Start from the base public filter (published only)
    const where = { ...publicBaseWhere };

    // Apply optional filters
    if (city)           where.city           = { [Op.iLike]: `%${city.trim()}%` };
    if (state)          where.state          = { [Op.iLike]: `%${state.trim()}%` };
    if (apartment_type) where.apartment_type = { [Op.iLike]: `%${apartment_type.trim()}%` };
    if (availability)   where.availability   = availability;
    if (bedrooms !== undefined && bedrooms !== '') {
      const bedroomCount = parseInt(bedrooms, 10);
      if (!isNaN(bedroomCount)) where.bedrooms = bedroomCount;
    }

    // Price range filter
    if (min_price || max_price) {
      where.price = {};
      if (min_price && !isNaN(Number(min_price))) {
        where.price[Op.gte] = Number(min_price);
      }
      if (max_price && !isNaN(Number(max_price))) {
        where.price[Op.lte] = Number(max_price);
      }
    }

    // Full-text search across multiple fields
    if (search && search.trim() !== '') {
      where[Op.or] = [
        { title:       { [Op.iLike]: `%${search.trim()}%` } },
        { description: { [Op.iLike]: `%${search.trim()}%` } },
        { city:        { [Op.iLike]: `%${search.trim()}%` } },
        { state:       { [Op.iLike]: `%${search.trim()}%` } },
        { apartment_type: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const { count, rows: apartments } = await Apartment.findAndCountAll({
      where,
      include: publicInclude,
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true, // required for correct count when using include with hasMany
    });

    const totalPages = Math.ceil(count / limitNum);

    return res.status(200).json({
      status: 'success',
      pagination: {
        total:        count,
        page:         pageNum,
        limit:        limitNum,
        totalPages,
        hasNextPage:  pageNum < totalPages,
        hasPrevPage:  pageNum > 1,
      },
      apartments,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/public/apartments/slug/:slug
//
// Fetches a single published apartment by its URL-friendly slug.
// Used for the apartment detail page — the slug appears in the browser URL.
// e.g. GET /api/public/apartments/slug/luxury-3-bedroom-flat
// ---------------------------------------------------------------------------
const getPublicApartmentBySlug = async (req, res, next) => {
  try {
    const apartment = await Apartment.findOne({
      where: {
        slug:   req.params.slug,
        status: 'published',
      },
      include: publicInclude,
    });

    if (!apartment) {
      return res.status(404).json({
        status: 'error',
        message: 'Apartment not found.',
      });
    }

    return res.status(200).json({ status: 'success', apartment });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/public/apartments/:id
//
// Fetches a single published apartment by its numeric ID.
// Useful for internal references where the ID is known.
// ---------------------------------------------------------------------------
const getPublicApartmentById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid apartment ID.',
      });
    }

    const apartment = await Apartment.findOne({
      where: {
        id,
        status: 'published',
      },
      include: publicInclude,
    });

    if (!apartment) {
      return res.status(404).json({
        status: 'error',
        message: 'Apartment not found.',
      });
    }

    return res.status(200).json({ status: 'success', apartment });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/public/filter-options
//
// Returns the unique values currently available in the database for
// use in populating the search/filter dropdowns on the frontend.
// Only looks at published apartments so draft listings do not pollute
// the filter options visitors see.
//
// Returns: cities, states, apartment_types, bedroom counts, price range
// ---------------------------------------------------------------------------
const getFilterOptions = async (req, res, next) => {
  try {
    const { sequelize } = require('../config/database');

    // Run all queries in parallel for efficiency
    const [cities, states, types, bedrooms, priceRange] = await Promise.all([
      // Distinct cities from published apartments, alphabetically sorted
      Apartment.findAll({
        where:      publicBaseWhere,
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('city')), 'city']],
        order:      [['city', 'ASC']],
        raw:        true,
      }),

      // Distinct states
      Apartment.findAll({
        where:      publicBaseWhere,
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('state')), 'state']],
        order:      [['state', 'ASC']],
        raw:        true,
      }),

      // Distinct apartment types
      Apartment.findAll({
        where:      publicBaseWhere,
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('apartment_type')), 'apartment_type']],
        order:      [['apartment_type', 'ASC']],
        raw:        true,
      }),

      // Distinct bedroom counts (sorted numerically)
      Apartment.findAll({
        where:      publicBaseWhere,
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('bedrooms')), 'bedrooms']],
        order:      [['bedrooms', 'ASC']],
        raw:        true,
      }),

      // Min and max price across all published apartments
      Apartment.findOne({
        where:      publicBaseWhere,
        attributes: [
          [sequelize.fn('MIN', sequelize.col('price')), 'min_price'],
          [sequelize.fn('MAX', sequelize.col('price')), 'max_price'],
        ],
        raw: true,
      }),
    ]);

    return res.status(200).json({
      status: 'success',
      filters: {
        cities:          cities.map((r) => r.city),
        states:          states.map((r) => r.state),
        apartment_types: types.map((r) => r.apartment_type),
        bedrooms:        bedrooms.map((r) => r.bedrooms),
        price_range: {
          min: priceRange ? Number(priceRange.min_price) : 0,
          max: priceRange ? Number(priceRange.max_price) : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicApartments,
  getPublicApartmentBySlug,
  getPublicApartmentById,
  getFilterOptions,
};
