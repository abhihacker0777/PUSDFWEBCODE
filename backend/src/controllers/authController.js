module.exports = {
  ...require("./auth/loginController"),
  ...require("./auth/passwordResetController"),
  ...require("./auth/sessionController")
};
