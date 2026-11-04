'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentConfig = sequelize.define('PaymentConfig', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  purpose: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'NGN' },
  description: { type: DataTypes.TEXT, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'payment_configs', underscored: true, timestamps: true });

module.exports = PaymentConfig;
