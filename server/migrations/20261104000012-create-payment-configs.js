'use strict';

/**
 * Migration: create payment_configs table.
 *
 * Administrators define configurable payment purposes and amounts here.
 * Payment records snapshot the purpose/amount at creation time so
 * future config changes never affect existing payment records.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_configs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // Human-readable label, e.g. "Application Fee"
      purpose: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      // URL-safe identifier, e.g. "application_fee"
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
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
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // Inactive configs cannot be used for new payments
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      // Admin who created this config
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payment_configs');
  },
};
