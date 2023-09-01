const express = require("express");
const router = express.Router();
const bookController = require("../controllers/book");
const auth = require("../middlewares/auth");
const multer = require("../middlewares/imgGreenCode");

router.post("/", auth, multer, bookController.createBook);

router.get("/", bookController.getAllBooks);

router.get("/bestrating", bookController.getBestRatedBooks);

router.put("/:id", auth, multer, bookController.updateBook);

router.get("/:id", bookController.getBookById);

router.delete("/:id", auth, bookController.deleteBook);

router.post("/:id/rating", auth, bookController.rateBook);

module.exports = router;
