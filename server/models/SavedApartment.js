'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SavedApartment = sequelize.define(
  'SavedApartment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    apartment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'saved_apartments',
    underscored: true,
    timestamps: true,
  }
);

module.exports = SavedApartment;
