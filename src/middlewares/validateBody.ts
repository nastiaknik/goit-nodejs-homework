import { Request, Response, NextFunction } from "express";
import HttpError from "../helpers/HttpError";
import Joi from "joi";

const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, _: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      next(new HttpError(400, error.message));
    }
    next();
  };
};

export default validateBody;
