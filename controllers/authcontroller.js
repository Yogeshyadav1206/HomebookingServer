const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
exports.postlogout = (req, res, next) => {
  req.session.isLoggedIn = false;
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};
exports.postlogin = async (req, res, next) => {
  const { Email, password } = req.body;
  // console.log("Login request received:", Email, password);

  try {
    const user = await User.findOne({ email: Email });
    if (!user) {
      return res.status(401).json({
        pageTitle: "Login",
        currentPage: "Login",
        isLoggedIn: false,
        errors: ["Invalid email"],
        oldInput: { Email },
        user: {},
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        pageTitle: "Login",
        currentPage: "Login",
        isLoggedIn: false,
        errors: ["Invalid email or password"],
        oldInput: { Email },
        user: {},
      });
    }

    req.session.isLoggedIn = true;
    req.session.user = user;
    await req.session.save();

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        favourites: user.favourites,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// we can send array of middlewares
exports.postsignup = [
  check("firstName")
    .notEmpty()
    .withMessage("First Name is required")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First Name must be at least 3 characters long")
    .matches(/^[A-Za-z]+$/)
    .withMessage("First Name must contain only letters"),
  check("lastName")
    .notEmpty()
    .withMessage("Last Name is required")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Last Name must be at least 3 characters long")
    .matches(/^[A-Za-z]+$/)
    .withMessage("Last Name must contain only letters"),

  check("email").notEmpty().withMessage("Email is required").normalizeEmail(),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  check("confirmPassword")
    .notEmpty()
    .withMessage("Confirm Password is required")
    .custom((value, { req }) => {
      // we get req here because it is an middleware
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  check("userType")
    .notEmpty()
    .withMessage("User Type is required")
    .isIn(["host", "guest"])
    .withMessage("Invalid User"),

  check("terms")
    .notEmpty()
    .withMessage("You must accept the terms and conditions")
    .custom((value) => {
      if (value !== "on") {
        throw new Error("You must accept the terms and conditions");
      }
      return true;
    }),

  // second middleware to handle the validation result
  async (req, res, next) => {
    // console.log(req.body);
    const { firstName, lastName, email, userType } = req.body;
    const errors = validationResult(req); // pass our req which contain all input and validate thosa at server side using validationResult of express
    // console.log(errors);
    if (!errors.isEmpty()) {
      // agr error aaya then render signup page again with previous valuse and errors
      // console.log("error aa gya");
      return res.status(422).json({
        pageTitle: "Signup",
        currentPage: "Signup",
        isLoggedIn: false,
        errors: errors.array().map((err) => err.msg), // send only error msg not complete error
        oldInput: {
          firstName,
          lastName,
          email,
          userType,
        },
        user: {},
      });
    } // create user if no error and save it to db through pass it to model
    // previously we are saving pass as plain text in db now we npm i bcryptjs and use it return an promise
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 12);
      const user = new User({
        firstName,
        lastName,
        email,
        userType,
        password: hashedPassword,
      });
      await user.save();
      // console.log("User signed up successfully");
      return res.status(201).json({
        success: true,
        message: "User signed up successfully. Please log in.",
      });
    } catch (err) {
      // console.log("Error in saving user", err);
      // res.redirect('/signup');
      return res.status(500).json({
        pageTitle: "Signup",
        currentPage: "Signup",
        isLoggedIn: false,
        errors: [err.message],
        oldInput: {
          firstName,
          lastName,
          email,
          userType,
        },
        user: {},
      });
    }
  },
];
