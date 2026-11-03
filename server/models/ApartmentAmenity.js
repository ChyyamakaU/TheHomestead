'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// This is the junction (join) table for the many-to-many relationship
// between Apartment and Amenity.
// An apartment can have many amenities; an amenity can belong to many apartments.
const ApartmentAmenity = sequelize.define(
  'ApartmentAmenity',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    apartment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amenity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'apartment_amenities',
    underscored: true,
    timestamps: true,
  }
);

module.exports = ApartmentAmenity;
