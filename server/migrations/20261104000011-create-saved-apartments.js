'use strict';

/**
 * Migration: create saved_apartments (favourites junction table).
 *
 * Many-to-many between users and apartments.
 * Unique constraint prevents saving the same apartment twice.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('saved_apartments', {
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      apartment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'apartments', key: 'id' },
        onDelete: 'CASCADE',
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

    // Ensure a user cannot save the same apartment twice
    await queryInterface.addIndex('saved_apartments', ['user_id', 'apartment_id'], {
      unique: true,
      name: 'saved_apartments_user_apartment_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('saved_apartments');
  },
};
