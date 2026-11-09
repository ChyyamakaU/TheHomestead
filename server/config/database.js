
'use strict';

const { Sequelize } = require('sequelize');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

// In development use the local PostgreSQL (configured via DB_* env vars) so
// the app is resilient to flaky remote connections (Neon). Production keeps
// using DATABASE_URL.
const useLocalDb = process.env.NODE_ENV !== 'production' && !!process.env.DB_NAME;

const sequelize = useLocalDb
  ? new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    )
  : new Sequelize(databaseUrl, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });

const connectToDatabase = async (retries = 5, delay = 2000) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
      return;
    } catch (error) {
      lastError = error;
      console.error(
        `Unable to connect to the database (attempt ${attempt}/${retries}):`,
        error.message,
      );
      if (attempt === retries) {
        console.error(
          'Database connection failed after all retries. Exiting.',
        );
        process.exit(1);
      }
      // Wait before retrying so a transient DB blip doesn't take the
      // whole server down (which previously caused 502 Bad Gateway on
      // /api/auth endpoints such as login and register).
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

const cliConfig = useLocalDb
  ? {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
    }
  : {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    };

module.exports = {
  sequelize,
  connectToDatabase,
  development: cliConfig,
  test: cliConfig,
  production: cliConfig,
};
