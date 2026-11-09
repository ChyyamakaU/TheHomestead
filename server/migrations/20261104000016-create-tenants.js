'use strict';

/**
 * Migration: create tenants table.
 *
 * A tenant record is created only after a successful verified payment.
 * It links a User to an Apartment, tracing back through the Application
 * and Payment that triggered the allocation.
 *
 * Key constraints:
 *  - application_id is UNIQUE — one application can produce at most one tenant
 *  - apartment_id has a partial unique index on active tenants — prevents
 *    double-allocation of the same apartment to two active tenants
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tenants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      apartment_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // SET NULL if apartment is deleted
        references: { model: 'apartments', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      application_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // SET NULL if application is deleted
        unique: true,    // one tenant per application
        references: { model: 'applications', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      payment_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // SET NULL if payment record is deleted
        references: { model: 'payments', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'terminated'),
        allowNull: false,
        defaultValue: 'active',
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Fast lookups by user
    await queryInterface.addIndex('tenants', ['user_id']);

    // Prevent two ACTIVE tenants for the same apartment
    // (allows the same apartment to be re-let after a tenancy ends)
    await queryInterface.addIndex('tenants', ['apartment_id', 'status'], {
      name: 'tenants_apartment_active_unique',
      unique: true,
      where: { status: 'active' },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tenants');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_tenants_status";
    `);
  },
};
