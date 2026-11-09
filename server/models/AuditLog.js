'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * AuditLog model.
 *
 * Table was created in migration 14. This model allows the writeAuditLog()
 * helper in paymentController to persist entries rather than console.log them.
 */
const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    old_value: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    new_value: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true,
  }
);

module.exports = AuditLog;
