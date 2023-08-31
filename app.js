const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());

mongoose
  .connect(
    "mongodb+srv://drasprast:8scaOED7zQV9kwNu@cluster0.e6sc4d5.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.get("/api/books", (req, res, next) => {
  const book = [
    {
      userId:
        "String - identifiant MongoDB unique de l'utilisateur qui a créé le livre",
      title: "String - titre du livre",
      author: "String - auteur du livre",
      imageUrl: "String - illustration/couverture du livre",
      year: "Number - année de publication du livre",
      genre: "String - genre du livre",
      ratings: [
        {
          userId:
            "String - identifiant MongoDB unique de l'utilisateur qui a noté le livre",
          grade: "Number - note donnée à un livre",
        },
      ],
      averageRating: "Number - note moyenne du livre",
    },
  ];
  res.status(200).json(book);
});

module.exports = app;
