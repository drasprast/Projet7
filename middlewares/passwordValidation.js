const PasswordValidation = require("password-validator");

const passwordSchema = new PasswordValidation();

passwordSchema
  .is()
  .min(8)
  .has()
  .uppercase()
  .has()
  .digits(1)
  .has()
  .not()
  .spaces();

module.exports = (req, res, next) => {
  const password = req.body.password;

  if (!passwordSchema.validate(password)) {
    return res.status(400).json({ message: "Mot de passe non conforme." });
  }

  next();
};
