'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  reference: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  apartment_id: { type: DataTypes.INTEGER, allowNull: true },
  application_id: { type: DataTypes.INTEGER, allowNull: true },
  payment_config_id: { type: DataTypes.INTEGER, allowNull: true },
  purpose: { type: DataTypes.STRING(100), allowNull: false },
  amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'NGN' },
  payment_method: { type: DataTypes.ENUM('cash','paystack'), allowNull: false },
  status: {
    type: DataTypes.ENUM('pending','processing','paid','failed','cancelled','refunded'),
    allowNull: false,
    defaultValue: 'pending',
  },
  paystack_reference: { type: DataTypes.STRING(200), allowNull: true, unique: true },
  paystack_data: { type: DataTypes.JSONB, allowNull: true },
  verified_by: { type: DataTypes.INTEGER, allowNull: true },
  verified_at: { type: DataTypes.DATE, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'payments', underscored: true, timestamps: true });

module.exports = Payment;
