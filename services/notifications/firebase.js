var admin = require("firebase-admin")

var serviceAccount = "services/notifications/serviseAccountKey.json"

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

module.exports = admin;