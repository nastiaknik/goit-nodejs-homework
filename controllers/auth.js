const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user");
const HttpError = require("../helpers/HttpError");
const ctrlWrapper = require("../helpers/ctrlWrapper");
const sendEmail = require("../helpers/sendEmail");
const { v4: uuidv4 } = require("uuid");
const { SECRET_KEY, FRONTEND_BASE_URL } = process.env;

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

  const verifyEmail = {
    to: email,
    subject: "Account Verification for Contact Book App",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; text-align: center; padding: 20px;">
    <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); padding: 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">Confirm your email</h2>
      <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
        Hi  ${newUser.name},
      </p>
      <p style="color: #555; font-size: 16px;">
        Thank you for choosing Contact Book. To complete your account setup, please verify your email by clicking the link below:
      </p>
      <a style="display: inline-block; background-color: #007BFF; color: #fff; text-decoration: none;
      padding: 10px 20px; border-radius: 5px; margin-top: 20px; font-weight: bold;" target="_blank" href="${FRONTEND_BASE_URL}/auth/verify/${verificationToken}">
        Verify Your Account
      </a>
    </div>
  </div>
  `,
  };

  await sendEmail(verifyEmail);

  res.status(201).json({
    name: newUser.name,
    email: newUser.email,
    verificationToken: newUser.verificationToken,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new HttpError(401, "Email or password is incorrect");
  }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw new HttpError(401, "Email or password is incorrect");
  }
  if (!user.verify) {
    throw new HttpError(403, "Email is not verified");
  }

  const payload = {
    id: user._id,
  };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.status(200).json({
    token,
    user: {
      name: user.name,
      email: user.email,
    },
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

const resentVerifyEmail = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (user.verify) {
    throw new HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    subject: "Account Verification for Contact Book App",
    html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; text-align: center; padding: 20px;">
    <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); padding: 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">Confirm your email</h2>
      <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
        Hi  ${user.name},
      </p>
      <p style="color: #555; font-size: 16px;">
        Thank you for choosing Contact Book. To complete your account setup, please verify your email by clicking the link below:
      </p>
      <a style="display: inline-block; background-color: #007BFF; color: #fff; text-decoration: none;
      padding: 10px 20px; border-radius: 5px; margin-top: 20px; font-weight: bold;" target="_blank" href="${FRONTEND_BASE_URL}/auth/verify/${user.verificationToken}">
        Verify Your Account
      </a>
    </div>
  </div>
    `,
  };

  await sendEmail(verifyEmail);
  res.json({ message: "Verification email sent" });
};

const sendRecoveryEmail = async (req, res) => {
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

  const resetEmail = {
    to: email,
    subject: "Password Reset for Contact Book App",
    html: `    
   <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; text-align: center; padding: 20px;">
        <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); padding: 20px;">
          <h2 style="color: #333;">Password Reset</h2>
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
            Hello ${user.name},
          </p>
          <p style="color: #333; font-size: 16px;">
            You've requested a password reset for your Contact Book App account. To change your password, please click the link below:
          </p>
          <a style="display: inline-block; background-color: #007BFF; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px; font-weight: bold;" target="_blank" href="${FRONTEND_BASE_URL}/auth/recovery/${token}">
            Reset Your Password
          </a>
          <p style="color: #555; font-size: 16px; margin-top: 20px;">
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      </div>`,
  };

  await sendEmail(resetEmail);
  res.status(200).json({ message: "Recovery email is sent" });
};

const changeUserPassword = async (req, res) => {
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
      user: updatedUser,
    });
  }
};

const getCurrent = async (req, res) => {
  const { email, name } = req.user;
  res.json({ email, name });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.json({
    message: "Logout success",
  });
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  verifyEmail: ctrlWrapper(verifyEmail),
  resentVerifyEmail: ctrlWrapper(resentVerifyEmail),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  sendRecoveryEmail: ctrlWrapper(sendRecoveryEmail),
  changeUserPassword: ctrlWrapper(changeUserPassword),
};
