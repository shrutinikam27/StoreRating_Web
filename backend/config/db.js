const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Root@123',
  database: process.env.DB_NAME || 'store_rating_platform',
};

let sequelizeInstance = null;

async function initializeDatabase() {
  try {
    // First, connect to MySQL server without database name to ensure the DB exists
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await connection.end();

    if (!sequelizeInstance) {
      sequelizeInstance = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });
    }
    
    // Test the connection
    await sequelizeInstance.authenticate();
    return sequelizeInstance;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

function getSequelize() {
  if (!sequelizeInstance) {
    sequelizeInstance = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: 'mysql',
      logging: false,
    });
  }
  return sequelizeInstance;
}

module.exports = {
  initializeDatabase,
  get sequelize() {
    return getSequelize();
  }
};
