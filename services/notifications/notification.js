const admin = require("./firebase.js")
const logger = require("../logger");

class Notification {
    static async send(fcmToken, title, body) {
        const icon = "launcher_icon_monochrome";
        try {
            const message = {
                notification: {
                    title: title,
                    body: body,
                },
                android: {
                    notification: {
                        icon: icon
                    }
                },
                token: fcmToken
            };
            const res = await admin.messaging().send(message)
            return res;
        }catch (e){
            logger.error("unable to send notification", e, {fcmToken: fcmToken})
        }
    }
}

module.exports = Notification;