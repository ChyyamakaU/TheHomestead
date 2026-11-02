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
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required' },
      },
    },
    role: {
      type: DataTypes.ENUM('superadmin', 'admin'),
      allowNull: false,
      defaultValue: 'admin',
      validate: {
        isIn: {
          args: [['superadmin', 'admin']],
          msg: 'Role must be superadmin or admin',
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
    // Sequelize will map createdAt/updatedAt to the snake_case columns
    // created_at/updated_at in the database.
    underscored: true,
    timestamps: true,

    // Hooks run automatically at key lifecycle points.
    hooks: {
      // Hash the password before creating a new user record.
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      // Hash the password before updating if it has been changed.
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

/**
 * Compares a plain-text password against the stored hash.
 * Called during login to verify credentials.
 * Defined as an instance method so it can be called as:
 *   user.comparePassword(plainText)
 */
User.prototype.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

/**
 * Returns a safe representation of the user — no password hash.
 * Used when sending user data back to the client so the hash
 * is never accidentally exposed in an API response.
 */
User.prototype.toSafeObject = function () {
  return {
    id: this.id,
    first_name: this.first_name,
    last_name: this.last_name,
    email: this.email,
    role: this.role,
    is_active: this.is_active,
    created_at: this.created_at,
  };
};

module.exports = User;
