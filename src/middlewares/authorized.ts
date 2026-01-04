import { NextFunction, Request, Response, RequestHandler } from "express";
import { UnauthorizedError } from "../Errors";

export const authorizeRoles = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role)) {
      throw new UnauthorizedError();
    }
    next();
  };
};
