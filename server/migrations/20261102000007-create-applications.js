'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('applications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // Nullable FK — SET NULL preserves record if apartment is deleted
      apartment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'apartments',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      // Snapshot of the apartment title at submission time
      apartment_title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      // --- Applicant contact details ---
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
      // Intended move-in date
      intended_move_in_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      // Optional covering message from the applicant
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // --- Application status workflow ---
      // pending → under_review → approved | rejected
      status: {
        type: Sequelize.ENUM(
          'pending',
          'under_review',
          'approved',
          'rejected'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      // Internal notes visible only to admin — not returned to public caller
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
    await queryInterface.dropTable('applications');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_applications_status";'
    );
  },
};
