const User = require("../models/userSchema");
const catchAsync = require("../utils/catchAsync");
const { promisify } = require("util");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/email");
const crypto = require("crypto");

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

const createSendToken = (user, statusCode, res) => {
  // console.log('user._id', user._id);
  const token = createToken(user._id);

  const cookieOption = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_EXPIRY) * 24 * 60 * 60 * 1000
    ),
    // secure: true, // will only be send on encrypted connection i.e., https
    httpOnly: true, // cannot be accessed or modified by the browser if enabled
  };

  if (process.env.NODE_ENV === "production") cookieOption["secure"] = true;

  res.cookie("jwt", token, cookieOption);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    // passwordChangedAt: req.body.passwordChangedAt,
    // role: req.body.role
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if required fields are provided
  if (!email || !password) {
    return next(new AppError("Please provide email and password.", 400));
  }

  //find user
  const user = await User.findOne({ email }).select("+password");

  // send error if user doesn't exist or the passwors is incorrect
  if (!user || !(await user.verifyPassword(password, user.password))) {
    return next(new AppError("Credentials are incorrect.", 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // get token from request if provided
  let token;
  const headers = req.headers;
  if (headers.authorization && headers.authorization.startsWith("Bearer")) {
    token = headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! Please sign in to get access.", 401)
    );
  }

  // check if the token is valid
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);
  const { id, iat, exp } = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // check if user exist with the correspoinding ID provided in the token
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("User does not exist. Please login again.", 401));
  }

  // check if the password has changed before the token is issued.
  if (!user.isTokenFresh(iat)) {
    return next(
      new AppError(
        "User recently changed the password. Please login again.",
        401
      )
    );
  }

  //Grant access of user to protected routes
  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // FIND USER
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("user with this email does not exist.", 404));
  }

  // CREATE TOKEN
  // const token = user.createPasswordResetToken();
  // await user.save({ validateBeforeSave: false });
  //  or
  const resetToken = await user.createPasswordResetTokenWithSave();
  // console.log(req.host);
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a patch request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password then ignore the email.`;

  try {
    await sendEmail({
      email: user.email,
      name: user.name,
      subject: "Sugar: Reset Your Password",
      message,
      resetToken: resetToken,
    });
    res.status(201).json({
      status: "success",
      message: "Token sent to email!",
      resetToken,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save({ validateBeforeSave: false });
    console.log("err", err);
    return next(
      new AppError(
        "There was an error sending the email. Please try again after some time.",
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // console.log(hashedToken);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // "Automated in it in pre save middleware"

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  // console.log(req.user);
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  if (!(await user.verifyPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
