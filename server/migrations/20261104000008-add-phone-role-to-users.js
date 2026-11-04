'use strict';

/**
 * Migration: add phone number and extend role ENUM to include 'tenant'.
 *
 * PostgreSQL does not support adding a value to an ENUM via queryInterface
 * directly in Sequelize — we must use raw SQL.
 *
 * Approach:
 *  1. Add the 'tenant' value to the existing enum_users_role type.
 *  2. Add the phone column to the users table.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Extend the role ENUM to include 'tenant'
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'tenant';`
    );

    // 2. Add phone column (nullable — existing admin records have no phone)
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the phone column.
    // Note: PostgreSQL does not support removing ENUM values, so the 'tenant'
    // value cannot be cleanly removed without recreating the type.
    // The down migration removes phone only; the ENUM change is irreversible
    // without a full type rebuild, which is acceptable for this context.
    await queryInterface.removeColumn('users', 'phone');
  },
};
