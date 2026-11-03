'use strict';

const { DataTypes, Op } = require('sequelize');
const slugify = require('slugify');
const { sequelize } = require('../config/database');

// ---------------------------------------------------------------------------
// generateUniqueSlug
// Defined BEFORE the model so it is available when hooks reference it.
// Builds a URL-friendly slug from the title. If the slug already exists
// in the DB, appends a counter suffix until it is unique.
// ---------------------------------------------------------------------------
const generateUniqueSlug = async (title, excludeId = null) => {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true, // strips special characters
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  // Use a lazy require here to avoid the circular-import problem that occurs
  // when the module tries to access Apartment before it is fully exported.
  // By the time generateUniqueSlug is *called* (at runtime, not at load time),
  // the Apartment model is already fully initialised and registered.
  const ApartmentModel = require('./Apartment');

  while (true) {
    const where = { slug };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const existing = await ApartmentModel.findOne({ where });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// ---------------------------------------------------------------------------
// Apartment model
// ---------------------------------------------------------------------------
const Apartment = sequelize.define(
  'Apartment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Title is required' },
        len: { args: [3, 255], msg: 'Title must be between 3 and 255 characters' },
      },
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: { msg: 'This apartment title is already taken' },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'City is required' },
      },
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'State is required' },
      },
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Nigeria',
    },
    apartment_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Apartment type is required' },
      },
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Price must be a valid number' },
        min: { args: [0], msg: 'Price cannot be negative' },
      },
    },
    payment_period: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'per year',
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Bedrooms cannot be negative' },
      },
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Bathrooms cannot be negative' },
      },
    },
    size: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'Size cannot be negative' },
      },
    },
    availability: {
      type: DataTypes.ENUM('available', 'occupied', 'unavailable'),
      allowNull: false,
      defaultValue: 'available',
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'draft',
    },
  },
  {
    tableName: 'apartments',
    underscored: true,
    timestamps: true,
    hooks: {
      // beforeValidate fires BEFORE Sequelize checks allowNull constraints,
      // so the slug is set before the null check on the slug column runs.
      beforeValidate: async (apartment) => {
        if (!apartment.slug || apartment.changed('title')) {
          apartment.slug = await generateUniqueSlug(
            apartment.title,
            apartment.isNewRecord ? null : apartment.id
          );
        }
      },
    },
  }
);

module.exports = Apartment;
