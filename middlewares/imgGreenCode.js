const multer = require("multer");
const path = require("path");
const sharp = require("sharp");

// Configure le stockage en mémoire pour les fichiers téléchargés
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // Limite la taille des fichiers à 1 Mo
  },
});

module.exports = (req, res, next) => {
  // Utilise multer pour gérer le téléchargement d'une seule image
  upload.single("image")(req, res, function (err) {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    if (!req.file) {
      return next();
    }

    // Génère un nom de fichier unique pour éviter les conflits
    const filename =
      req.file.originalname.split(" ").join("_") + Date.now() + ".webp";

    // Utilise Sharp pour redimensionner et convertir l'image en format WebP
    sharp(req.file.buffer)
      .resize(463) // Redimensionne l'image à une largeur de 463 pixels
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
