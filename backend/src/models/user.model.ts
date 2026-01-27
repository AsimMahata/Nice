import bcrypt from "bcryptjs";
import { NextFunction } from "express";
import mongoose, {Schema, Document} from "mongoose";

export interface IUser extends Document {
    name: string;
    username: string;
    email: string;
    password?: string;
    provider: "Local" | "Google" | "Github";
    providerId?: string;

    codeforcesLink?: string;
    leetcodeLink?: string;
    githubLink?: string;
    linkedinLink?: string;

    isPasswordCorrect(password: string): Promise<boolean>;
}


const userSchema: Schema<IUser> = new Schema(
    {
        name : {
            type : String,
        },
        username : {
            type : String,
            unique : true,
            lowercase : true,
        },
        email : {
            type : String,
            lowercase: true,
            required : true,
            unique : true,
        },
        password : {
            type : String,
        },
        provider: {
            type: String,
            required: true,
            enum: ["Local", "Google", "Github"],
            default: "Local"
        },
        codeforcesLink : { 
            type : String,
        },
        leetcodeLink : { 
            type : String,
        },
        githubLink : { 
            type : String,
        },
        linkedinLink : { 
            type : String,
        },
        providerId : {
            type : String,
        }
    }, 
    {
        timestamps : true,
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) {
        return; 
    }

    try {
        this.password = await bcrypt.hash(this.password, 10);
    } catch (error: any) {
        throw error;
    }
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);

