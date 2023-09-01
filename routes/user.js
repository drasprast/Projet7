const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const limiter = require("../middlewares/ratelimiter");
const passwordValidator = require("../middlewares/passwordValidator");

router.post("/signup", passwordValidator, limiter, userController.signup);
router.post("/login", limiter, userController.login);

module.exports = router;
