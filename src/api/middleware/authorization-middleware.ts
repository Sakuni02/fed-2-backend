import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import ForbiddenError from "../../domain/errors/forbidden-error";

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);

  const userIsAdmin = auth.sessionClaims?.metadata?.role === "admin";

  if (!userIsAdmin) {
    throw new ForbiddenError("Forbidden");
  }

  next();
};

export { isAdmin };