const express = require("express");
const authController = require("../controllers/authController");
const statController = require("../controllers/statController");
const router = express.Router();

router
  .route("/latest-stat")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    statController.getLatestStat
  );
router
  .route("/")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    statController.getAllStats
  )
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    statController.createStat
  );

module.exports = router;
