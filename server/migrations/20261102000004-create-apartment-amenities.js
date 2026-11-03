'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('apartment_amenities', {
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
        // Deleting an apartment removes all its amenity links automatically
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      amenity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'amenities',
          key: 'id',
        },
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

    // Prevent the same amenity from being added to the same apartment twice
    await queryInterface.addConstraint('apartment_amenities', {
      fields: ['apartment_id', 'amenity_id'],
      type: 'unique',
      name: 'unique_apartment_amenity',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('apartment_amenities');
  },
};
