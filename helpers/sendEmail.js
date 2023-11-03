const sgMail = require("@sendgrid/mail");
const { SENDGRID_API_KEY, FRONTEND_BASE_URL } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

const sendVerificationEmail = async ({ userName, userEmail, token }) => {
  const email = {
    to: userEmail,
    from: "anastazja.knihnitska@gmail.com",
    subject: "Account Verification for Contact Book App",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; text-align: center; padding: 20px;">
    <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); padding: 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">Confirm your email</h2>
      <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
        Hi  ${userName},
      </p>
      <p style="color: #555; font-size: 16px;">
        Thank you for choosing Contact Book. To complete your account setup, please verify your email by clicking the link below:
      </p>
      <a style="display: inline-block; background-color: #007BFF; color: #fff; text-decoration: none;
      padding: 10px 20px; border-radius: 5px; margin-top: 20px; font-weight: bold;" target="_blank" href="${FRONTEND_BASE_URL}/auth/verify/${token}">
        Verify Your Account
      </a>
    </div>
  </div>
  `,
  };
  await sgMail.send(email);
  return true;
};

const sendRecoveryEmail = async ({ userName, userEmail, token }) => {
  const email = {
    from: "anastazja.knihnitska@gmail.com",
    to: userEmail,
    subject: "Password Reset for Contact Book App",
    html: `    
   <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; text-align: center; padding: 20px;">
        <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); padding: 20px;">
          <h2 style="color: #333;">Password Reset</h2>
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
            Hello ${userName},
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
  await sgMail.send(email);
  return true;
};

module.exports = { sendVerificationEmail, sendRecoveryEmail };
