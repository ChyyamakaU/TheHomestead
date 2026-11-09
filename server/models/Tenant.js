'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Tenant model.
 *
 * Created automatically when a Paystack payment is successfully verified.
 * Links a User to an Apartment and traces back to the Application and Payment
 * that triggered the allocation.
 *
 * A tenant record is NEVER created by application approval alone —
 * only a verified payment triggers allocation.
 */
const Tenant = sequelize.define(
  'Tenant',
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
      allowNull: true,
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true, // one tenant per application
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'terminated'),
      allowNull: false,
      defaultValue: 'active',
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'tenants',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Tenant;
