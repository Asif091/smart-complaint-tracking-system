const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { getUsers, createUser, deactivateUser, updateUser } = require("../controllers/userController");

router.get("/", auth, getUsers);
router.post("/", auth, createUser);
router.patch("/:id/status", auth, deactivateUser);
router.put("/:id", auth, updateUser);

module.exports = router;