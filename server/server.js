'use strict';

require('dotenv').config();
const app = require('./app');
const { connectToDatabase } = require('./config/database');

const PORT = process.env.PORT || 5000;

/**
 * Starts the server.
 * First confirms the database connection is healthy, then begins
 * listening for incoming HTTP requests. If the database is unreachable,
 * connectToDatabase() will log the error and exit the process before
 * the server starts.
 */
const startServer = async () => {
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer();
