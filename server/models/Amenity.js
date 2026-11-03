'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Amenity = sequelize.define(
  'Amenity',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { msg: 'This amenity already exists' },
      validate: {
        notEmpty: { msg: 'Amenity name is required' },
        len: { args: [2, 100], msg: 'Amenity name must be between 2 and 100 characters' },
      },
    },
  },
  {
    tableName: 'amenities',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Amenity;
