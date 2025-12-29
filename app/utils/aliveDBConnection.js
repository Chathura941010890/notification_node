const DefectType = require('../models/defectType.model');
const logger = require('./logger');

const aliveConnection = async (req, res, next) => {
    try {
        console.log("Alive DB connection function called at - " , new Date());
        const description = "Major";
        const df = await DefectType.findOne({ where: { description } });
    }
    catch (err) {
        logger.error(`Caught DB con alive error at - : ${new Date()} message - ${err.message}`);
    }
}

module.exports = {
    aliveConnection
}