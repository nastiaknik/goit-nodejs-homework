import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";

import HttpError from "../helpers/HttpError";
const { SECRET_KEY = "" } = process.env;

interface TokenPayload {
  id: string;
}

const authenticate = async (req: any, _: Response, next: NextFunction) => {
  const { authorization = "" } = req.headers;
  const [bearer, token] = authorization.split(" ");
  if (bearer !== "Bearer") {
    return next(new HttpError(401));
  }
  try {
    const { id } = jwt.verify(token, SECRET_KEY as string) as TokenPayload;
    const user = await User.findById(id);
    if (!user || !user.token || user.token !== token) {
      return next(new HttpError(401));
    }

    req.user = user;

    next();
  } catch {
    next(new HttpError(401));
  }
};

export default authenticate;
