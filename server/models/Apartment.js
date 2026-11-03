'use strict';

const { DataTypes } = require('sequelize');
const slugify = require('slugify');
const { sequelize } = require('../config/database');

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
      // Auto-generate the slug from the title before creating a record.
      // If a slug collision occurs (two apartments with the same title),
      // a timestamp suffix is appended to keep it unique.
      beforeCreate: async (apartment) => {
        apartment.slug = await generateUniqueSlug(apartment.title);
      },
      // Regenerate the slug if the title changes on update.
      beforeUpdate: async (apartment) => {
        if (apartment.changed('title')) {
          apartment.slug = await generateUniqueSlug(apartment.title, apartment.id);
        }
      },
    },
  }
);

/**
 * Generates a unique URL-friendly slug from a title.
 * If the base slug already exists in the database (for a different record),
 * appends a numeric suffix until unique: "title-1", "title-2", etc.
 *
 * @param {string} title - The apartment title
 * @param {number|null} excludeId - The current apartment's id (for updates, to exclude self)
 */
const generateUniqueSlug = async (title, excludeId = null) => {
  const { Op } = require('sequelize');

  const baseSlug = slugify(title, {
    lower: true,
    strict: true,   // removes special characters
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const whereClause = { slug };
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const existing = await Apartment.findOne({ where: whereClause });
    if (!existing) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

module.exports = Apartment;
