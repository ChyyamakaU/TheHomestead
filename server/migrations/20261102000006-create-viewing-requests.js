'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('viewing_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // Soft reference to the apartment — stored as both a foreign key and
      // a snapshot of the title at submission time. The title snapshot means
      // the request still makes sense even if the apartment is later renamed.
      apartment_id: {
        type: Sequelize.INTEGER,
        // allowNull: true so SET NULL works when an apartment is deleted.
        // The apartment_title snapshot still identifies the apartment even
        // after apartment_id becomes null.
        allowNull: true,
        references: {
          model: 'apartments',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      // Snapshot of the apartment title at the time of submission
      apartment_title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      preferred_date: {
        type: Sequelize.DATEONLY, // DATE without time component
        allowNull: false,
      },
      preferred_time: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // Status workflow: pending → confirmed → completed | cancelled
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      // Admin can leave internal notes on a request (not visible to visitor)
      admin_notes: {
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('viewing_requests');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_viewing_requests_status";'
    );
  },
};
