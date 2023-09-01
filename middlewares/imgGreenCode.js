const multer = require("multer");
const path = require("path");
const sharp = require("sharp");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024,
  },
});

module.exports = (req, res, next) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    if (!req.file) {
      return next();
    }

    const filename =
      req.file.originalname.split(" ").join("_") + Date.now() + ".webp";

    sharp(req.file.buffer)
      .resize(463)
      .toFormat("webp", { quality: 80 })
      .toFile(path.join("images", filename), (err, info) => {
        if (err) {
          return res.status(500).json({ message: err.message });
        }
        req.file.filename = filename;
        next();
      });
  });
};
