const { Schema, model } = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name is required."],
    },
    email: {
      type: String,
      required: [true, "email is required."],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "provide a valid Email"],
    },
    photo: String,
    password: {
      type: String,
      required: [true, "password is required"],
      minlength: 8,
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, "password is required"],
      validate: {
        // will only validate on SAVE
        validator: function (val) {
          return val === this.password;
        },
        message: "passwords does not match",
      },
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "lead-guide", "guide", "user"],
        message: "role provided is incorrect.",
      },
      default: "user",
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.verifyPassword = async function (
  candidatePassword,
  UserHashedPassword
) {
  return await bcrypt.compare(candidatePassword, UserHashedPassword);
};

userSchema.methods.isTokenFresh = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const passwordTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return passwordTimeStamp < JWTTimeStamp;
  }
  return true;
};

userSchema.statics.getEnumValues = function (field) {
  return this.schema.path(field).enumValues;
};

userSchema.methods.createPasswordResetTokenWithSave = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // save encrypted token in database
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  //the values will only save in the instance unless to call save() method to save it in the database
  await this.save({ validateBeforeSave: false });

  return resetToken;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // save encrypted token in database
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
const User = model("User", userSchema);

module.exports = User;
