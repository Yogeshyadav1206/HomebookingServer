
// External Module
const express = require("express");
const authRouter = express.Router();

// Local Module
const authController=require('../controllers/authcontroller');

authRouter.post("/login",authController.postlogin);
authRouter.post("/logout",authController.postlogout);
authRouter.post("/signup",authController.postsignup);


module.exports = authRouter;
 