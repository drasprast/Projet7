const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // Récupère le token depuis l'en-tête "Authorization"
    const token = req.headers.authorization.split(" ")[1];

    // Vérifie et décrypte le token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Stocke l'ID de l'utilisateur dans l'objet req.auth
    req.auth = {
      userId: decodedToken.userId,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Accès non autorisé" });
  }
};
