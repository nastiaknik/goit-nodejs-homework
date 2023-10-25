const Joi = require("joi");

const emailRegExp = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

const registerSchema = Joi.object({
  name: Joi.string()
    .required()
    .messages({ "any.required": "missing required name field" }),
  email: Joi.string()
    .required()
    .pattern(emailRegExp)
    .messages({ "any.required": "missing required email field" }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({ "any.required": "missing required password field" }),
});

const verifyEmailSchema = Joi.object({
  email: Joi.string()
    .required()
    .pattern(emailRegExp)
    .messages({ "any.required": "missing required email field" }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .required()
    .pattern(emailRegExp)
    .messages({ "any.required": "missing required email field" }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({ "any.required": "missing required password field" }),
});

const passwordRecoverySchema = Joi.object({
  password: Joi.string().min(6).required().messages({
    "any.required": "missing required 'password' field",
    "string.min": "password length must be at least 6 characters long",
  }),
});

const googleTokenSchema = Joi.object({
  googleToken: Joi.string()
    .required()
    .messages({ "any.required": "missing required google token field" }),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  passwordRecoverySchema,
  googleTokenSchema,
};
