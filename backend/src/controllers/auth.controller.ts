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
    return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }


  return res.redirect(`${process.env.CLIENT_URL}/`);
});


const registerGithub = asyncHandler(async (req: Request, res: Response)=>{
  if (!req.user) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }

  
  return res.redirect(`${process.env.CLIENT_URL}/`);
})


const loginLocal = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email, provider: "Local" });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    req.login(user, (err) => {
        if (err) {
            throw new ApiError(500, "Session serialization failed");
        }

        const loggedInUser = user.toObject();
        delete loggedInUser.password;

        return res
            .status(200)
            .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
    });
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    req.logout((err) => {
        if (err) throw new ApiError(500, "Error during logout");
        
        res.clearCookie("connect.sid"); 
        
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "User logged out successfully"));
    });
});

export { 
    registerLocal, 
    registerGoogle, 
    registerGithub,
    loginLocal,
    logoutUser
};