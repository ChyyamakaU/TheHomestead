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
      max: 10,       // Maximum number of connections in the pool
      min: 0,        // Minimum number of connections in the pool
      acquire: 30000, // Max ms to wait when acquiring a connection
      idle: 10000,   // Max ms a connection can sit idle before release
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

// ---------------------------------------------------------------------------
// Sequelize CLI configuration
// The CLI requires a plain config object — it cannot use the Sequelize
// instance above. We export it under `module.exports` so that .sequelizerc
// can point the CLI directly at this file.
// The app uses the named exports { sequelize, connectToDatabase }.
// ---------------------------------------------------------------------------
module.exports = {
  sequelize,
  connectToDatabase,

  // CLI config — reads the same env vars the app uses
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
  },
};
