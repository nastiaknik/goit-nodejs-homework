import { Request, Response, NextFunction } from "express";

type ControllerFunction = (
  req: any,
  res: Response,
  next: NextFunction
) => Promise<void>;

const ctrlWrapper = (ctrl: ControllerFunction) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ctrl(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export default ctrlWrapper;
