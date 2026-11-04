'use strict';

/**
 * Migration: create payments table.
 *
 * Each row is one payment transaction. Purpose and amount are snapshotted
 * from the payment_config at creation time so future config changes
 * never alter existing payment records.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // Unique human-readable reference, e.g. HM-20261104-A3F9B
      reference: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT', // never silently delete a payment record
        onUpdate: 'CASCADE',
      },
      // Optional links — a payment may relate to an apartment and/or application
      apartment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'apartments', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      application_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'applications', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      // Reference back to the config that defined this charge (for traceability)
      payment_config_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'payment_configs', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      // Snapshotted at creation — never changes even if config is updated
      purpose: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'NGN',
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'paystack'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          'pending',
          'processing',
          'paid',
          'failed',
          'cancelled',
          'refunded'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      // Paystack-specific fields (null for cash payments)
      paystack_reference: {
        type: Sequelize.STRING(200),
        allowNull: true,
        unique: true,
      },
      paystack_data: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      // Cash verification fields
      verified_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // Index for fast lookups by user
    await queryInterface.addIndex('payments', ['user_id']);
    // Index for status filtering
    await queryInterface.addIndex('payments', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payments');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_payments_payment_method";
      DROP TYPE IF EXISTS "enum_payments_status";
    `);
  },
};
