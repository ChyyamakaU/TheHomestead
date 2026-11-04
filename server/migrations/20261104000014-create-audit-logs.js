'use strict';

/**
 * Migration: create audit_logs table.
 *
 * Records privileged actions — payment verifications, status changes,
 * admin actions on user records. Provides a tamper-evident trail.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // Who performed the action (null if system-generated)
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      // Short action code, e.g. 'PAYMENT_VERIFIED', 'APPLICATION_STATUS_UPDATED'
      action: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      // What type of record was affected
      entity_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      // ID of the affected record
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      // State before the change (JSON)
      old_value: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      // State after the change (JSON)
      new_value: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      // Request IP for security tracking
      ip_address: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Audit logs are append-only — no updated_at needed
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('audit_logs', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
  },
};
