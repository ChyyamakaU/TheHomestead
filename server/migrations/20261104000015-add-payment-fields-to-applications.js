'use strict';

/**
 * Migration: add payment tracking fields to the applications table.
 *
 * - Extends the status ENUM with 'payment_completed'
 * - Adds payment_status, approved_at, payment_deadline columns
 *
 * PostgreSQL does not support removing ENUM values, so the down migration
 * cannot fully revert the ENUM extension; it drops the added columns only.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Extend the status ENUM — PostgreSQL requires ALTER TYPE
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_applications_status" ADD VALUE IF NOT EXISTS 'payment_completed';
    `);

    // 2. Add payment_status ENUM and column
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_applications_payment_status"
          AS ENUM ('unpaid', 'pending_payment', 'paid', 'expired');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryInterface.addColumn('applications', 'payment_status', {
      type: Sequelize.ENUM('unpaid', 'pending_payment', 'paid', 'expired'),
      allowNull: true, // null means the application hasn't been approved yet
      defaultValue: null,
    });

    // 3. approved_at — timestamp when the admin approved the application
    await queryInterface.addColumn('applications', 'approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    // 4. payment_deadline — date by which the applicant must pay
    await queryInterface.addColumn('applications', 'payment_deadline', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('applications', 'payment_deadline');
    await queryInterface.removeColumn('applications', 'approved_at');
    await queryInterface.removeColumn('applications', 'payment_status');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_applications_payment_status";
    `);
    // Note: cannot remove 'payment_completed' from enum_applications_status in PostgreSQL
  },
};
