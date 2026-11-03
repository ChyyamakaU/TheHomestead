'use strict';

const { sequelize } = require('../config/database');

const User             = require('./User');
const Apartment        = require('./Apartment');
const Amenity          = require('./Amenity');
const ApartmentAmenity = require('./ApartmentAmenity');
const ApartmentImage   = require('./ApartmentImage');
const ViewingRequest   = require('./ViewingRequest');

// ---------------------------------------------------------------------------
// Associations
// All relationships between models are defined here in one place.
// ---------------------------------------------------------------------------

// Apartment <-> Amenity  (many-to-many through ApartmentAmenity)
// An apartment can have many amenities; an amenity can appear on many apartments.
Apartment.belongsToMany(Amenity, {
  through: ApartmentAmenity,
  foreignKey: 'apartment_id',
  otherKey: 'amenity_id',
  as: 'amenities',
});
Amenity.belongsToMany(Apartment, {
  through: ApartmentAmenity,
  foreignKey: 'amenity_id',
  otherKey: 'apartment_id',
  as: 'apartments',
});

// Apartment -> ApartmentImage  (one-to-many)
// An apartment can have up to 10 images; each image belongs to one apartment.
Apartment.hasMany(ApartmentImage, {
  foreignKey: 'apartment_id',
  as: 'images',
  onDelete: 'CASCADE',
});
ApartmentImage.belongsTo(Apartment, {
  foreignKey: 'apartment_id',
  as: 'apartment',
});

// Apartment -> ViewingRequest  (one-to-many, nullable FK)
// An apartment can have many viewing requests.
// apartment_id is nullable so requests survive apartment deletion (SET NULL).
Apartment.hasMany(ViewingRequest, {
  foreignKey: 'apartment_id',
  as: 'viewingRequests',
  onDelete: 'SET NULL',
});
ViewingRequest.belongsTo(Apartment, {
  foreignKey: 'apartment_id',
  as: 'apartment',
});

// ---------------------------------------------------------------------------
// db object — the central export for the entire data layer
// ---------------------------------------------------------------------------
const db = {
  sequelize,
  User,
  Apartment,
  Amenity,
  ApartmentAmenity,
  ApartmentImage,
  ViewingRequest,
};

module.exports = db;
