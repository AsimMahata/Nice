import { User } from "../models/user.model.js";
import { Request, Response } from "express";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerLocal = asyncHandler(async (req: Request, res: Response) => {
    const { name, username, email, password } = req.body;

    if ([name, username, email, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const user = await User.create({
        name,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password,
        provider: "Local" 
    });

    const createdUser = await User.findById(user._id).select("-password");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const registerGoogle = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, "Google Authentication failed");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Logged in with Google successfully"));
});

const registerGithub = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, "GitHub Authentication failed");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Logged in with GitHub successfully"));
});

export { 
    registerLocal, 
    registerGoogle, 
    registerGithub,
};