const admin = requrie("./firebase.js")

class Notification {
    static async send(fcmToken, title, body) {
        const icon = "launcher_icon_monochrome";
        try {
            const message = {
                notification: {
                    titile: title,
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
            //TODO: handle error
        }
    }
}

module.exports = Notification;