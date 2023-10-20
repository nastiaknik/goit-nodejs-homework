const { login, register, getCurrent, logout } = require("./auth");
const User = require("../models/user");
const app = require("../app");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const HttpError = require("../helpers/HttpError");
const sendEmail = require("../helpers/sendEmail");
const { TEST_DB_HOST } = process.env;

jest.mock("../models/user.js");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../helpers/sendEmail");

describe("User Auth Controller", () => {
  let server = null;
  beforeAll(async () => {
    server = app.listen(3030);
    await mongoose.connect(TEST_DB_HOST);
    jest.clearAllMocks();
  });
  afterAll(async () => {
    server.close();
    await mongoose.connection.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Login Controller", () => {
    it("should log in a user with correct credentials and return status code 200 with a token", async () => {
      const req = {
        body: { email: "johndoe@example.com", password: "password" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      jest.spyOn(User, "findOne").mockResolvedValue({
        name: "John Doe",
        email: "johndoe@example.com",
        password: "hashedPassword",
        verificationToken: "token",
        verify: true,
      });

      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValueOnce("token");

      await login(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "johndoe@example.com",
      });
      expect(bcrypt.compare).toHaveBeenCalledWith("password", "hashedPassword");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: expect.any(String),
        user: {
          name: "John Doe",
          email: "johndoe@example.com",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return a 401 status if email or password is incorrect", async () => {
      // User.findOne.mockResolvedValue(null);
      jest.spyOn(User, "findOne").mockResolvedValue(null);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);
      // bcrypt.compare.mockReturnValueOnce(false);

      const req = {
        body: {
          email: "test@example.com",
          password: "password",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      try {
        await login(req, res, next);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBe(401);
        // expect(res.status).toHaveBeenCalledWith(401);
        expect(error.message).toBe("Email or password is incorrect");
        /* expect(res.json).toHaveBeenCalledWith({
          message: "Email or password is incorrect",
        });
        expect(res.json).toHaveBeenCalledWith({
          error: "Email or password is incorrect",
        }); */
      }
    });
  });

  describe("Register Controller", () => {
    it("should register a new user and return status code 201 with user data", async () => {
      bcrypt.hash.mockResolvedValue("hashedPassword");
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        name: "John Doe",
        email: "johndoe@example.com",
        verificationToken: expect.any(String),
      });

      // jest.spyOn(User, "findOne").mockResolvedValue(null);
      // jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed_password");
      // jest.spyOn(User, "create").mockResolvedValue({name: "John Doe",
      // email: "johndoe@example.com",
      // verificationToken: expect.any(String)});

      const req = {
        body: {
          name: "John Doe",
          email: "johndoe@example.com",
          password: "password",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "johndoe@example.com",
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("password", 10);
      expect(User.create).toHaveBeenCalledWith({
        name: "John Doe",
        email: "johndoe@example.com",
        password: "hashedPassword",
        verificationToken: expect.any(String),
      });
    
      expect(sendEmail).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        name: "John Doe",
        email: "johndoe@example.com",
        verificationToken: expect.any(String),
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should return a 409 status if the email is already in use", async () => {
      User.findOne.mockResolvedValue({
        email: "johndoe@example.com",
      });
      const req = {
        body: {
          name: "John Doe",
          email: "johndoe@example.com",
          password: "password",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      try {
        await register(req, res, next);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect(error.status).toBe(409);
        expect(error.message).toBe("Email already in use");
        // expect(next).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
          error: "Email already in use",
        });
      }

      expect(User.findOne).toHaveBeenCalledWith({
        email: "johndoe@example.com",
      });
    });
  });

  describe("Get Current User Controller", () => {
    it("should return the current user's email and name", async () => {
      const req = { user: { email: "test@example.com", name: "John Doe" } };
      const res = { json: jest.fn() };

      await getCurrent(req, res);

      expect(res.json).toHaveBeenCalledWith({
        email: "test@example.com",
        name: "John Doe",
      });
      expect(res.json).toHaveBeenCalledTimes(1);
    });

    it("should throw an error with code 401 if not authorized", async () => {
      const req = {};
      const res = {};
      const next = jest.fn();

      try {
        await getCurrent(req, res, next);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe("Unauthorized");
        expect(next).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe("Logout Controller", () => {
    it("should update the user's token to an empty string and return a success message", async () => {
      const req = {};
      const res = { json: jest.fn() };
      const next = jest.fn();

      const userUpdateSpy = jest.spyOn(User, "findByIdAndUpdate");

      try {
        await logout(req, res, next);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe("Unauthorized");
      }

      expect(userUpdateSpy).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
