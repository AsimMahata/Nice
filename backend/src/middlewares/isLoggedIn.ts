import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {

  if (!req.user) {
    return res.status(401).json(
      new ApiResponse(401, null, "Authentication required")
    );
  }

  next();
};
