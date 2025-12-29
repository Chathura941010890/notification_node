const admin = require("firebase-admin");
const serviceAccount = require("../config/inqube-notification-service-firebase-adminsdk.json");

const setupFCM = () => {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("FCM connected successfully!");
    
}

module.exports = {
    setupFCM
}