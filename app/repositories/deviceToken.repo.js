const DeviceToken = require('../models/deviceToken.model')
const sequelize = require("../db_con/index.js");
const { QueryTypes, Sequelize } = require('sequelize');
const { cleanupOldDeviceTokens } = require('../services/notificationService.js');
const cron = require("node-cron");

const saveDeviceToken = async (deviceToken, email, platform = 'android') => {
    const t = await sequelize.transaction();
    try{

        if (!deviceToken || !email) {
            throw new Error({ error: "Device token and email are required." });
        }

        const ifExists = await DeviceToken.findAll({
            where : {
                device_token : deviceToken
            }
        });

        if(ifExists.length > 0){
            await t.commit();
            return "Already registered! Success!";
        }
        else{
            await DeviceToken.create({
                email : email,
                device_token : deviceToken,
                platform : platform,
                is_active : true
            }, {transaction : t })

            await t.commit();
            return "Saved successfully!";
        }

    }
    catch (error){
        await t.rollback();
        console.log(error);
        throw new Error(error.message || "Error in saving token!");
    }
}

// Cron job to inactive unused device tokens
cron.schedule("05 8 * * *", async () => {
  try {
    cleanupOldDeviceTokens();
  } catch (err) {
    console.error("❌ Error cleaning devices :", err);
  }
});


module.exports = {
    saveDeviceToken
}