import { Request, Response } from "express";
import asynHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

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

export const updateUser = asynHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
        throw new ApiError(401, "Unauthorized");
    }

    const { name, username, codeforcesLink, leetcodeLink, githubLink, linkedinLink } = req.body;
    
    // @ts-ignore
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                name,
                username,
                codeforcesLink,
                leetcodeLink,
                githubLink,
                linkedinLink
            }
        },
        { new: true }
    ).select("-password");

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "User updated successfully"));
});
