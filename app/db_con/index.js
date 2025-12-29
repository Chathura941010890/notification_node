const Sequelize = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
    config.database.database, 
    config.database.username, 
    config.database.password, 
    {
        host: config.database.host,
        port: config.database.port,
        dialect: config.database.dialect,
        pool: config.database.pool,
        logging: config.database.logging,
        reconnect: true,
        dialectOptions: {
            multipleStatements: true,
        },
        retry: {
            max: 10,
        }
    });

sequelize.addHook('afterConnect', (connection) => {
    logger.info('Connected to the database', { 
        database: connection.config.database,
        host: connection.config.host 
    });
});

sequelize.addHook('beforeDisconnect', () => {
    logger.info('About to disconnect from the database');
});

sequelize
    .authenticate()
    .then(() => {
        logger.info('Database connection established successfully', {
            database: config.database.database,
            host: config.database.host
        });
    })
    .catch(err => {
        logger.error('Unable to connect to the database', { error: err.message });
    });

sequelize
  .sync({ force: false, alter: false })
  .then(() => {
    console.log('Database synchronized.');
  })
  .catch(err => {
    logger.error('Unable to synchronize the database:', err);
  });


module.exports = sequelize;