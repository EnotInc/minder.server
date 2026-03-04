const express = require("express");
const router = express.Router();
const authController = require("../Controllers/authController");
const auth = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.get("/me", auth, authController.me);

module.exports = router;