const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const notesController = require("../Controllers/notesController");

router.get("/", auth, notesController.list);
router.post("/add", auth, notesController.add);
router.post("/edit", auth, notesController.edit);
router.delete("/delete", auth, notesController.remove);
router.get("/:id", auth, notesController.getById);

router.post("/notify/add", auth, notesController.notifyAdd);
router.post("/notify/edit", auth, notesController.notifyEdit);
router.delete("/notify/delete", auth, notesController.notifyDelete);
router.get("/notify/list", auth, notesController.notifyList);

module.exports = router;