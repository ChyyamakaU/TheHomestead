'use strict';

/**
 * Migration: support Google OAuth via Supabase Auth.
 *
 * Changes:
 *  1. supabase_id — stores the Supabase UUID for Google-authenticated users.
 *     UNIQUE so a Supabase account maps to exactly one local user.
 *     NULL for existing password-based accounts.
 *
 *  2. password — changed from NOT NULL to nullable.
 *     Google-sign-in users have no password; existing accounts are unaffected.
 *
 * Security notes:
 *  - Matching by email alone is NOT used to link Google accounts to existing
 *    password accounts. supabase_id is the canonical link.
 *  - Admin/superadmin accounts cannot be created through Google sign-in
 *    (role is hardcoded to 'tenant' in the OAuth callback handler).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add supabase_id column — unique, nullable
    await queryInterface.addColumn('users', 'supabase_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
      defaultValue: null,
    });

    // 2. Make password nullable for Google-only accounts
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert password to NOT NULL (will fail if any null passwords exist)
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.removeColumn('users', 'supabase_id');
  },
};
