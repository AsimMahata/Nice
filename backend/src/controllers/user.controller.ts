import { Request, Response } from "express";
import asynHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getCurrentUser = asynHandler(
  async (req: Request, res: Response) => {
    console.log(req.isAuthenticated());
    if (!req.isAuthenticated()) {
      return res
        .status(200)
        .json(new ApiResponse(200, null, "User not logged in"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "User fetched successfully"));
  },
);
