const Book = require("../models/book");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  let averageRating = bookObject.averageRating ? bookObject.averageRating : 0;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
    averageRating,
  });

  book
    .save()
    .then(() => res.status(201).json({ message: "Livre enregistré !" }))
    .catch((error) =>
      res
        .status(400)
        .json({ error, message: "Erreur lors de la sauvegarde du livre" })
    );
};

exports.updateBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };
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
        previousImage = book.imageUrl.split("/images/")[1];
      }
      Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id }
      )
        .then(() => {
          if (previousImage) {
            fs.unlink(`images/${previousImage}`, (err) => {});
          }
          res.status(200).json({ message: "Livre modifié!" });
        })
        .catch((error) => {
          if (req.file) {
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
  const grade = parseFloat(req.body.rating);

  if (isNaN(grade) || grade < 0 || grade > 5) {
    return res.status(400).json({ message: "La note est invalide." });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        throw new Error("Livre non trouvé!");
      }

      const userRating = book.ratings.find(
        (rating) => rating.userId.toString() === req.auth.userId
      );
      if (userRating) {
        throw new Error("Vous avez déjà noté ce livre.");
      }

      book.ratings.push({
        userId: req.auth.userId,
        grade,
      });

      const totalRatings = book.ratings.reduce(
        (acc, curr) => acc + curr.grade,
        0
      );
      book.averageRating = Math.round(totalRatings / book.ratings.length);

      return book.save();
    })
    .then((updatedBook) => {
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
