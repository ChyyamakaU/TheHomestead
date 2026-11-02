'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash the password before inserting.
    // The User model hooks do NOT run during seeders — seeders interact
    // with the database directly via queryInterface, bypassing Sequelize
    // model lifecycle hooks. We therefore hash manually here.
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin@12345', salt);

    await queryInterface.bulkInsert('users', [
      {
        first_name: 'Super',
        last_name: 'Admin',
        email: 'admin@thehomestead.com',
        password: hashedPassword,
        role: 'superadmin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: 'admin@thehomestead.com',
    });
  },
};
