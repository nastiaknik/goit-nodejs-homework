import { Schema, model } from "mongoose";
import handleMongooseError from "../helpers/handleMongooseError";
import { IUser } from "src/types/User";

const userSchema = new Schema<IUser>(
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

userSchema.post<IUser>("save", handleMongooseError);

const User = model<IUser>("User", userSchema);

export default User;
