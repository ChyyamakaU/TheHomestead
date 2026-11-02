'use strict';

const { sequelize } = require('../config/database');

// This file is the central registry for all Sequelize models.
// As models are created in later phases, they will be imported
// here and any associations between them will be defined here.
//
// This pattern keeps all relationship definitions in one place
// rather than scattered across individual model files.

const db = {
  sequelize,
  // Models will be added here in Phase 3 onwards, for example:
  // User: require('./User'),
  // Apartment: require('./Apartment'),
};

module.exports = db;
