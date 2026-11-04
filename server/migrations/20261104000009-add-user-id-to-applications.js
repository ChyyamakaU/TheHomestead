'use strict';

/**
 * Migration: add user_id FK to applications table.
 *
 * Nullable so existing anonymous applications are preserved.
 * Unique constraint on (user_id, apartment_id) prevents a tenant from
 * submitting more than one application for the same apartment.
 *
 * The unique index is partial (WHERE user_id IS NOT NULL) so anonymous
 * applications (user_id = NULL) are not affected by the constraint.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add user_id column (nullable FK)
    await queryInterface.addColumn('applications', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // 2. Partial unique index — one application per user per apartment
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX applications_user_apartment_unique
      ON applications (user_id, apartment_id)
      WHERE user_id IS NOT NULL AND apartment_id IS NOT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS applications_user_apartment_unique;`
    );
    await queryInterface.removeColumn('applications', 'user_id');
  },
};
