'use strict';

const { sequelize } = require('../config/database');

const User           = require('./User');
const Apartment      = require('./Apartment');
const Amenity        = require('./Amenity');
const ApartmentAmenity = require('./ApartmentAmenity');
const ApartmentImage = require('./ApartmentImage');
const ViewingRequest = require('./ViewingRequest');
const Application    = require('./Application');
const SavedApartment = require('./SavedApartment');

// ---------------------------------------------------------------------------
// Associations
// ---------------------------------------------------------------------------

// Apartment <-> Amenity (many-to-many)
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

// Apartment -> ApartmentImage (one-to-many)
Apartment.hasMany(ApartmentImage, {
  foreignKey: 'apartment_id',
  as: 'images',
  onDelete: 'CASCADE',
});
ApartmentImage.belongsTo(Apartment, {
  foreignKey: 'apartment_id',
  as: 'apartment',
});

// Apartment -> ViewingRequest (one-to-many, nullable FK)
Apartment.hasMany(ViewingRequest, {
  foreignKey: 'apartment_id',
  as: 'viewingRequests',
  onDelete: 'SET NULL',
});
ViewingRequest.belongsTo(Apartment, {
  foreignKey: 'apartment_id',
  as: 'apartment',
});

// Apartment -> Application (one-to-many, nullable FK)
Apartment.hasMany(Application, {
  foreignKey: 'apartment_id',
  as: 'applications',
  onDelete: 'SET NULL',
});
Application.belongsTo(Apartment, {
  foreignKey: 'apartment_id',
  as: 'apartment',
});

// User -> Application (one-to-many, nullable FK)
User.hasMany(Application, {
  foreignKey: 'user_id',
  as: 'applications',
  onDelete: 'SET NULL',
});
Application.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// User -> ViewingRequest (one-to-many, nullable FK)
User.hasMany(ViewingRequest, {
  foreignKey: 'user_id',
  as: 'viewingRequests',
  onDelete: 'SET NULL',
});
ViewingRequest.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// User <-> Apartment via SavedApartment (many-to-many)
User.belongsToMany(Apartment, {
  through: SavedApartment,
  foreignKey: 'user_id',
  otherKey: 'apartment_id',
  as: 'savedApartments',
});
Apartment.belongsToMany(User, {
  through: SavedApartment,
  foreignKey: 'apartment_id',
  otherKey: 'user_id',
  as: 'savedByUsers',
});

// Direct associations needed for queries
SavedApartment.belongsTo(User,      { foreignKey: 'user_id',      as: 'user' });
SavedApartment.belongsTo(Apartment, { foreignKey: 'apartment_id', as: 'apartment' });
User.hasMany(SavedApartment,        { foreignKey: 'user_id',      as: 'savedApartmentRecords' });

// ---------------------------------------------------------------------------
const db = {
  sequelize,
  User,
  Apartment,
  Amenity,
  ApartmentAmenity,
  ApartmentImage,
  ViewingRequest,
  Application,
  SavedApartment,
};

module.exports = db;
