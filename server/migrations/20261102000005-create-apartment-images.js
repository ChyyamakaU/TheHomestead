'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('apartment_images', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      apartment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'apartments',
          key: 'id',
        },
        // Deleting an apartment removes all its images automatically
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      // Filename of the uploaded file stored in server/uploads/
      // e.g. "1699900000000-apartment.jpg"
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      // Public URL path served by Express static middleware
      // e.g. "/uploads/1699900000000-apartment.jpg"
      url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      // Only one image per apartment can be the primary (cover) image
      is_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // Controls the display order in the gallery (0 = first)
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.dropTable('apartment_images');
  },
};
