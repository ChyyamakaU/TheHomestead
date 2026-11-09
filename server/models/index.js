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
const PaymentConfig  = require('./PaymentConfig');
const Payment        = require('./Payment');
const Tenant         = require('./Tenant');
const AuditLog       = require('./AuditLog');

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
// Payment associations
// ---------------------------------------------------------------------------
User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments', onDelete: 'RESTRICT' });
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Apartment.hasMany(Payment, { foreignKey: 'apartment_id', as: 'payments', onDelete: 'SET NULL' });
Payment.belongsTo(Apartment, { foreignKey: 'apartment_id', as: 'apartment' });
Application.hasMany(Payment, { foreignKey: 'application_id', as: 'payments', onDelete: 'SET NULL' });
Payment.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });
PaymentConfig.hasMany(Payment, { foreignKey: 'payment_config_id', as: 'payments', onDelete: 'SET NULL' });
Payment.belongsTo(PaymentConfig, { foreignKey: 'payment_config_id', as: 'paymentConfig' });
User.hasMany(PaymentConfig, { foreignKey: 'created_by', as: 'createdConfigs' });
PaymentConfig.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ---------------------------------------------------------------------------
// Tenant associations
// ---------------------------------------------------------------------------
User.hasMany(Tenant,        { foreignKey: 'user_id',        as: 'tenancies',    onDelete: 'RESTRICT' });
Tenant.belongsTo(User,      { foreignKey: 'user_id',        as: 'user' });
Apartment.hasMany(Tenant,   { foreignKey: 'apartment_id',   as: 'tenancies',    onDelete: 'SET NULL' });
Tenant.belongsTo(Apartment, { foreignKey: 'apartment_id',   as: 'apartment' });
Application.hasOne(Tenant,  { foreignKey: 'application_id', as: 'tenant',       onDelete: 'SET NULL' });
Tenant.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });
Payment.hasOne(Tenant,      { foreignKey: 'payment_id',     as: 'tenant',       onDelete: 'SET NULL' });
Tenant.belongsTo(Payment,   { foreignKey: 'payment_id',     as: 'payment' });

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
  PaymentConfig,
  Payment,
  Tenant,
  AuditLog,
};

module.exports = db;
