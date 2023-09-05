const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const limiter = require("../middlewares/rateLimit");
const passwordValidation = require("../middlewares/passwordValidation");

router.post("/signup", passwordValidation, limiter, userController.signup);
router.post("/login", limiter, userController.login);

module.exports = router;
