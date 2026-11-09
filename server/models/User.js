'use strict';

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'First name is required' },
        len: { args: [1, 100], msg: 'First name must be between 1 and 100 characters' },
      },
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Last name is required' },
        len: { args: [1, 100], msg: 'Last name must be between 1 and 100 characters' },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: { msg: 'An account with this email address already exists' },
      validate: {
        notEmpty: { msg: 'Email is required' },
        isEmail: { msg: 'Please provide a valid email address' },
      },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true, // null for Google-authenticated users
    },
    supabase_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true, // one Supabase account → one local user
    },
    role: {
      type: DataTypes.ENUM('superadmin', 'admin', 'tenant'),
      allowNull: false,
      defaultValue: 'tenant',
      validate: {
        isIn: {
          args: [['superadmin', 'admin', 'tenant']],
          msg: 'Role must be superadmin, admin or tenant',
        },
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

User.prototype.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

/**
 * Returns a safe user object — no password hash.
 * Includes phone for tenant profile use.
 */
User.prototype.toSafeObject = function () {
  return {
    id: this.id,
    first_name: this.first_name,
    last_name: this.last_name,
    email: this.email,
    phone: this.phone || null,
    role: this.role,
    is_active: this.is_active,
    created_at: this.created_at,
  };
};

module.exports = User;
