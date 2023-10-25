const { Schema, model } = require("mongoose");
const handleMongooseError = require("../helpers/handleMongooseError");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      unique: true,
      required: [true, "Email is required"],
    },
    password: {
      type: String,
      minLength: 6,
    },
    token: String,
    verificationToken: {
      type: String,
    },
    verify: {
      type: Boolean,
      default: false,
    },
    resetToken: {
      token: String,
      expiration: Date,
    },
  },
  { versionKey: false, timestamps: true }
);

userSchema.post("save", handleMongooseError);

const User = model("user", userSchema);

module.exports = User;
