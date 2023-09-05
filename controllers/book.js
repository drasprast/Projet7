const Book = require("../models/book");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  // Récupère les données du livre depuis la requête POST
  const bookObject = JSON.parse(req.body.book);

  delete bookObject._id;
  delete bookObject._userId;

  // Détermine la note moyenne du livre (s'il n'est pas défini, utilise 0 par défaut)
  const averageRating = bookObject.averageRating || 0;

  // Crée une instance du modèle Book avec les données du livre
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId, // Affecte l'ID de l'utilisateur authentifié au livre
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`, // Crée l'URL de l'image à partir du nom de fichier téléchargé
    averageRating, // Affecte la note moyenne au livre
  });

  book
    .save() // Utilisation de la méthode save() pour enregistrer le livre
    .then(() => {
      res.status(201).json({ message: "Livre enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({
        error: error.message || "Erreur lors de la sauvegarde du livre",
      });
    });
};

exports.updateBook = (req, res, next) => {
  // Crée un objet bookObject à partir des données reçues dans la requête
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  // Recherche le livre par son ID dans la base de données
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }

      if (book.userId != req.auth.userId) {
        return res.status(401).json({ message: "Pas autorisé" });
      }

      let previousImage = "";
      if (req.file) {
        // Si une nouvelle image est téléchargée, conserve le nom de l'ancienne image
        previousImage = book.imageUrl.split("/images/")[1];
      }

      // Met à jour le livre dans la base de données en utilisant Book.updateOne()
      Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id }
      )
        .then(() => {
          if (previousImage) {
            // Supprime l'ancienne image du système de fichiers (s'il y en a une)
            fs.unlink(`images/${previousImage}`, (err) => {});
          }
          res.status(200).json({ message: "Livre modifié!" });
        })
        .catch((error) => {
          if (req.file) {
            // En cas d'erreur, supprime la nouvelle image téléchargée (si elle existe)
            fs.unlink(`images/${req.file.filename}`, (err) => {});
          }
          res.status(400).json({ error });
        });
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.deleteBook = (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        return res.status(401).json({ message: "Pas autorisé" });
      }

      // Obtenir le nom de fichier de l'image à partir de l'URL
      const filename = book.imageUrl.split("/images/")[1];

      // Supprimer l'image du système de fichiers
      fs.unlink(`images/${filename}`, (err) => {
        if (err) {
          console.error("Erreur Suppression Image:", err);
          return res.status(500).json({ error: "Erreur Suppression Image." });
        }

        // Supprimer le livre de la base de données
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Livre supprimé!" }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.getBookById = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.rateBook = (req, res) => {
  // Récupère la note du livre à partir de la requête
  const grade = parseFloat(req.body.rating);

  // Vérifie si la note est valide (entre 0 et 5)
  if (isNaN(grade) || grade < 0 || grade > 5) {
    return res.status(400).json({ message: "La note est invalide." });
  }

  // Recherche le livre par son ID dans la base de données
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé!" });
      }

      // Vérifie si l'utilisateur a déjà noté ce livre
      const hasUserRated = book.ratings.some(
        (rating) => rating.userId.toString() === req.auth.userId
      );

      if (hasUserRated) {
        return res
          .status(403)
          .json({ message: "Vous avez déjà noté ce livre." });
      }

      // Ajoute la nouvelle notation à la liste des notations du livre
      book.ratings.push({ userId: req.auth.userId, grade });

      // Calcule la nouvelle note moyenne du livre
      const totalRatings = book.ratings.reduce(
        (acc, curr) => acc + curr.grade,
        0
      );
      book.averageRating = Math.round(totalRatings / book.ratings.length);

      return book.save();
    })
    .then((updatedBook) => {
      // Envoie une réponse JSON avec le livre mis à jour
      res.status(200).json(updatedBook);
    })
    .catch((error) => {
      if (error.message === "Livre non trouvé!") {
        res.status(404).json({ message: error.message });
      } else if (error.message === "Vous avez déjà noté ce livre.") {
        res.status(403).json({ message: error.message });
      } else {
        res.status(400).json({ error });
      }
    });
};

exports.getBestRatedBooks = (req, res) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).send(books))
    .catch((error) => res.status(500).json({ error }));
};
