const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user");
const HttpError = require("../helpers/HttpError");
const ctrlWrapper = require("../helpers/ctrlWrapper");
const {
  sendVerificationEmail,
  sendRecoveryEmail,
} = require("../helpers/sendEmail");
const { v4: uuidv4 } = require("uuid");
const { SECRET_KEY } = process.env;
const jwt_decode = require("jwt-decode");

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    throw new HttpError(409, "Email already in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const verificationToken = uuidv4();

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

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new HttpError(401, "Email or password is incorrect");
  }
  const passwordCompare = bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw new HttpError(401, "Email or password is incorrect");
  }
  if (!user.verify) {
    throw new HttpError(403, "Email is not verified");
  }

  const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.status(200).json({
    token,
    user: { name: user.name, email: user.email, _id: user._id },
  });
};

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
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

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (user.verify) {
    throw new HttpError(400, "Verification has already been passed");
  }

  await sendVerificationEmail({
    userName: user.name,
    userEmail: user.email,
    token: user.verificationToken,
  });

  res.json({ message: "Verification email sent" });
};

const recoverPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new HttpError(404, "User is not found");
  }

  const token = crypto.randomBytes(20).toString("hex");
  const expirationTime = new Date(Date.now() + 3600000); // token is valid for 1 hour

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

const changePassword = async (req, res) => {
  const { password } = req.body;
  const token = req.params.resetToken;

  const user = await User.findOne({ "resetToken.token": token });

  if (!user) {
    throw new HttpError(404, "User is not found");
  }

  const savedToken = user.resetToken.token;
  const tokenExpiration = user.resetToken.expiration;

  if (!savedToken || token !== savedToken || Date.now() >= tokenExpiration) {
    throw new HttpError(400, "Invalid or expired token");
  }

  if (token === savedToken && Date.now() <= tokenExpiration) {
    const hashPassword = await bcrypt.hash(password, 12);

    const updatedUser = await User.findByIdAndUpdate(
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
        name: updatedUser.name,
        email: updatedUser.email,
        _id: updatedUser._id,
      },
    });
  }
};

const getCurrent = async (req, res) => {
  const { email, name, _id } = req.user;
  res.json({ email, name, _id });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.json({
    message: "Logout success",
  });
};

const googleAuth = async (req, res) => {
  const { googleToken } = req.body;

  if (!googleToken) {
    throw new HttpError(400, "Google token is missing");
  }

  const userObj = jwt_decode(googleToken);
  const { name, email } = userObj;

  const user = await User.findOne({ email });

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

    await User.findByIdAndUpdate(user._id, { token }, { new: true });

    res.status(201).json({
      user: { name: newUser.name, email: newUser.email, _id: newUser._id },
      token,
      message: "Registered with Google successfully",
    });
  }

  if (user) {
    const token = jwt.sign({ id: user._id }, SECRET_KEY, {
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

module.exports = {
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
