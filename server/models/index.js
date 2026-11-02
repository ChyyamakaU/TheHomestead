'use strict';

const { sequelize } = require('../config/database');
const User = require('./User');

// Central registry for all Sequelize models.
// Every model is imported here and exported as part of the db object.
// Associations between models are also defined here, keeping
// relationship logic in one place rather than scattered across files.

const db = {
  sequelize,
  User,
  // Future models will be added here, for example:
  // Apartment: require('./Apartment'),
  // Application: require('./Application'),
};

// ---------------------------------------------------------------------------
// Associations
// Define relationships between models here as they are introduced.
// Example:
//   db.Apartment.hasMany(db.Application, { foreignKey: 'apartment_id' });
//   db.Application.belongsTo(db.Apartment, { foreignKey: 'apartment_id' });
// ---------------------------------------------------------------------------

module.exports = db;
