const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const categoriesController = require("../Controllers/categoriesController");

router.get("/", auth, categoriesController.list);
router.post("/add", auth, categoriesController.add);
router.post("/edit", auth, categoriesController.edit);
router.delete("/delete", auth, categoriesController.remove);

module.exports = router;