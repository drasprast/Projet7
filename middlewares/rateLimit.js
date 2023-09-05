const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: "Trop de requêtes, veuillez réessayer après 5 minutes",
});

module.exports = limiter;
