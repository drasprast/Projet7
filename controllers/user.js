const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const User = require("../models/user");

exports.signup = (req, res, next) => {
  const email = req.body.email;

  // Vérifie si l'adresse e-mail est valide en utilisant le module `validator`
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Adresse e-mail invalide" });
  }

  // Utilise bcrypt pour hacher le mot de passe avec un coût de 10
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => createUser(req, res, hash)) // Appelle la fonction createUser avec le hachage du mot de passe
    .catch((error) => res.status(500).json({ error }));
};

// Fonction qui crée un nouvel utilisateur dans la base de données
const createUser = (req, res, hash) => {
  // Crée un nouvel objet utilisateur avec l'adresse e-mail et le mot de passe haché
  const user = new User({
    email: req.body.email,
    password: hash,
  });

  // Sauvegarde l'utilisateur dans la base de données
  user
    .save()
    .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  // Recherche l'utilisateur dans la base de données par son adresse e-mail
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return handleLoginError(res);
      }
      // Compare le mot de passe fourni avec le mot de passe haché stocké dans la base de données
      comparePasswords(password, user.password, res, user._id);
    })
    .catch((error) => res.status(500).json({ error }));
};

// Fonction pour gérer les erreurs de login en renvoyant une réponse non autorisée
const handleLoginError = (res) => {
  res.status(401).json({ message: "Login/mot de passe incorrect" });
};

// Fonction pour comparer le mot de passe fourni avec le mot de passe haché
const comparePasswords = (password, hashedPassword, res, userId) => {
  // Utilise bcrypt pour comparer les mots de passe
  bcrypt
    .compare(password, hashedPassword)
    .then((valid) => {
      // Si les mots de passe ne correspondent pas, renvoie une erreur de login
      if (!valid) {
        return handleLoginError(res);
      }
      // Si les mots de passe correspondent, génère un jeton JWT et le renvoie dans la réponse
      // const token = jwt.sign({ userId }, process.env.JWT_SECRET,
      const token = jwt.sign({ userId }, "RANDOM_TOKEN_SECRET", {
        expiresIn: "24h",
      });
      res.status(200).json({ userId, token });
    })
    .catch((error) => res.status(500).json({ error }));
};
