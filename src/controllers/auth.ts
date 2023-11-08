import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import jwt_decode from "jwt-decode";
import User from "../models/user";
import HttpError from "../helpers/HttpError";
import ctrlWrapper from "../helpers/ctrlWrapper";
import { sendVerificationEmail, sendRecoveryEmail } from "../helpers/sendEmail";
import { IUser } from "../types/User";

const { SECRET_KEY = "" } = process.env;

interface RequestBody {
  name: string;
  email: string;
  password: string;
}

const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password }: RequestBody = req.body;

  const user: IUser | null = await User.findOne({ email });
  if (user) {
    throw new HttpError(409, `Email ${email} already in use`);
  }

  const hashPassword: string = await bcrypt.hash(password, 10);
  const verificationToken: string = uuidv4();

  const newUser = await User.create({
    name,
    email,
    password: hashPassword,
    verificationToken,
  });

  await sendVerificationEmail({
    userName: newUser.name,
    userEmail: newUser.email,
    token: verificationToken,
  });

  res.status(201).json({
    user: { name: newUser.name, email: newUser.email, _id: newUser._id },
    verificationToken: newUser.verificationToken,
  });
};

const login = async (req: Request, res: Response): Promise<void> => {
  const email: string = req.body.email;
  const password: string = req.body.password;

  const user: IUser | null = await User.findOne({ email });

  if (!user) {
    throw new HttpError(401, "Email or password is incorrect");
  }
  if (user.password) {
    const passwordCompare = bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw new HttpError(401, "Email or password is incorrect");
    }
  }
  if (!user.verify) {
    throw new HttpError(403, "Email is not verified");
  }
  if (!SECRET_KEY) {
    throw new HttpError(
      500,
      "Internal Server Error: SECRET KEY is not defined"
    );
  }

  const token: string = jwt.sign({ id: user._id }, SECRET_KEY, {
    expiresIn: "23h",
  });
  await User.findByIdAndUpdate(user._id, { token });

  res.status(200).json({
    token,
    user: { name: user.name, email: user.email, _id: user._id },
  });
};

const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const verificationToken: string = req.params.verificationToken;
  const user: IUser | null = await User.findOne({ verificationToken });
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  await User.findByIdAndUpdate(
    user._id,
    {
      verify: true,
      verificationToken: null,
    },
    { new: true }
  );
  res.json({ message: "Verification successful" });
};

const resendVerifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const email: string = req.body.email;

  const user: IUser | null = await User.findOne({ email });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (user.verify) {
    throw new HttpError(400, "Verification has already been passed");
  }

  await sendVerificationEmail({
    userName: user.name,
    userEmail: user.email,
    token: user.verificationToken || "",
  });

  res.json({ message: "Verification email sent" });
};

const recoverPassword = async (req: Request, res: Response): Promise<void> => {
  const email: string = req.body.email;

  const user: IUser | null = await User.findOne({ email });
  if (!user) {
    throw new HttpError(404, "User is not found");
  }

  const token: string = crypto.randomBytes(20).toString("hex");
  const expirationTime: Date = new Date(Date.now() + 3600000);

  await User.findByIdAndUpdate(user._id, {
    resetToken: { token, expiration: expirationTime },
  });

  await sendRecoveryEmail({
    userName: user.name,
    userEmail: user.email,
    token,
  });

  res.status(200).json({ message: "Recovery email is sent" });
};

const changePassword = async (req: Request, res: Response): Promise<void> => {
  const password: string = req.body.password;
  const token: string = req.params.resetToken;

  const user: IUser | null = await User.findOne({
    "resetToken.token": token,
  });

  if (!user) {
    throw new HttpError(404, "User is not found");
  }

  const savedToken: string | undefined = user.resetToken?.token;
  const tokenExpiration: Date | undefined = user.resetToken?.expiration;

  if (
    !savedToken ||
    !tokenExpiration ||
    token !== savedToken ||
    Date.now() > tokenExpiration.getTime()
  ) {
    throw new HttpError(400, "Invalid or expired token");
  }

  if (token === savedToken && Date.now() <= tokenExpiration.getTime()) {
    const hashPassword = await bcrypt.hash(password, 12);

    const updatedUser: IUser | null = await User.findByIdAndUpdate(
      user._id,
      {
        password: hashPassword,
        resetToken: { token: null, expiration: null },
      },
      { new: true }
    );

    res.status(200).json({
      message: "Password is successfully changed",
      user: {
        name: updatedUser?.name,
        email: updatedUser?.email,
        _id: updatedUser?._id,
      },
    });
  }
};

const getCurrent = async (req: any, res: Response): Promise<void> => {
  const { email, name, _id } = req.user;
  res.json({ email, name, _id });
};

const logout = async (req: any, res: Response): Promise<void> => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.json({
    message: "Logout success",
  });
};

const googleAuth = async (req: Request, res: Response): Promise<void> => {
  const { googleToken } = req.body;

  if (!googleToken) {
    throw new HttpError(400, "Google token is missing");
  }
  if (!SECRET_KEY) {
    throw new HttpError(
      500,
      "Internal Server Error: SECRET KEY is not defined"
    );
  }

  const userObj: { name: string; email: string } = jwt_decode(googleToken);
  const { name, email } = userObj;

  const user: IUser | null = await User.findOne({ email });

  if (!user) {
    const newUser = await User.create({
      name,
      email,
      verificationToken: null,
      verify: true,
    });

    const token = jwt.sign({ id: newUser._id }, SECRET_KEY, {
      expiresIn: "23h",
    });

    await User.findByIdAndUpdate(newUser._id, { token }, { new: true });

    res.status(201).json({
      user: { name: newUser.name, email: newUser.email, _id: newUser._id },
      token,
      message: "Registered with Google successfully",
    });
  }

  if (user) {
    const token: string = jwt.sign({ id: user._id }, SECRET_KEY, {
      expiresIn: "23h",
    });

    await User.findByIdAndUpdate(
      user._id,
      { verify: true, verificationToken: null, token },
      { new: true }
    );

    res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        _id: user._id,
      },
      token,
      message: "Logged in with Google successfully",
    });
  }
};

export const authControllers = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  recoverPassword: ctrlWrapper(recoverPassword),
  changePassword: ctrlWrapper(changePassword),
  googleAuth: ctrlWrapper(googleAuth),
};
