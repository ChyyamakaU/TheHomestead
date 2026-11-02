'use strict';

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create a Sequelize instance using environment variables.
// All connection details are kept out of source code and read
// from the .env file at runtime.
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',

    // Disable Sequelize's query logging in production to avoid
    // leaking SQL statements into production logs.
    // In development, log queries to the console for easier debugging.
    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    pool: {
      max: 10,      // Maximum number of connections in the pool
      min: 0,       // Minimum number of connections in the pool
      acquire: 30000, // Maximum ms to wait before throwing an error when acquiring a connection
      idle: 10000,  // Maximum ms a connection can be idle before being released
    },
  }
);

/**
 * Attempts to authenticate the database connection.
 * Called once at server startup to confirm the DB is reachable.
 * Exits the process if the connection fails so the problem is
 * immediately visible rather than causing silent errors later.
 */
const connectToDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectToDatabase };
