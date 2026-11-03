'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('apartments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      // slug is a URL-friendly version of the title, e.g. "2-bedroom-flat-lekki"
      // Used for clean public URLs like /apartments/2-bedroom-flat-lekki
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // Full street address
      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Nigeria',
      },
      apartment_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        // e.g. Studio, 1 Bedroom, 2 Bedroom, Duplex, Penthouse, etc.
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      // e.g. "per year", "per month"
      payment_period: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'per year',
      },
      bedrooms: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      bathrooms: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // Floor area in square metres — optional
      size: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
      },
      // availability: whether the unit is available to rent
      // Values: available | occupied | unavailable
      availability: {
        type: Sequelize.ENUM('available', 'occupied', 'unavailable'),
        allowNull: false,
        defaultValue: 'available',
      },
      // status: controls whether the listing is visible on the public site
      // Values: draft | published
      status: {
        type: Sequelize.ENUM('draft', 'published'),
        allowNull: false,
        defaultValue: 'draft',
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
    await queryInterface.dropTable('apartments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_apartments_availability";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_apartments_status";');
  },
};
