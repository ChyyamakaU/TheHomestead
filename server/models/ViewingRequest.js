'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ViewingRequest = sequelize.define(
  'ViewingRequest',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    apartment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // nullable — existing anonymous requests preserved
    },
    // Title snapshot — preserves apartment identity even after deletion
    apartment_title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Apartment title is required' },
      },
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Full name is required' },
        len: { args: [2, 255], msg: 'Full name must be between 2 and 255 characters' },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Email address is required' },
        isEmail: { msg: 'Please provide a valid email address' },
      },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Phone number is required' },
      },
    },
    preferred_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Preferred viewing date is required' },
        isDate: { msg: 'Preferred date must be a valid date' },
      },
    },
    preferred_time: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Preferred viewing time is required' },
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'viewing_requests',
    underscored: true,
    timestamps: true,
  }
);

module.exports = ViewingRequest;
