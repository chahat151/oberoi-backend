const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const router = express.Router();

router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);
router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);
router
  .route("/update-me")
  .patch(authController.protect, userController.updateMe);
router
  .route("/delete-me")
  .delete(authController.protect, userController.deleteMe);
router
  .route("/updatePassword")
  .patch(authController.protect, authController.updatePassword);
router
  .route("/:id")
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    userController.deleteUser
  );

module.exports = router;
