const notificationService = require("../../services/notificationService");
const logger = require("../../utils/logger");

const sendNotification = async (datax, correlationId = null) => {
  try {
    const result = await notificationService.sendNotification(datax, correlationId);
    
    logger.info("Notification sending completed:", {
      correlationId,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed
    });

    return result;

  } catch (error) {
    logger.error("Error in sendNotification function:", {
      correlationId,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  sendNotification,
};