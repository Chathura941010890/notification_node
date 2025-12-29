require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'stocktakeadmin',
    password: process.env.DB_PASS || 'In@ubeStkT@k@dmin',
    database: process.env.DB_NAME || 'notification_service',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log
  },
  test: {
    username: process.env.DB_USER_TEST || process.env.DB_USER || 'stocktakeadmin',
    password: process.env.DB_PASS_TEST || process.env.DB_PASS || 'In@ubeStkT@k@dmin',
    database: process.env.DB_NAME_TEST || 'notification_service',
    host: process.env.DB_HOST_TEST || process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT_TEST || process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    }
  }
};
