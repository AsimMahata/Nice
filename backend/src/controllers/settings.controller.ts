import { Request, Response } from "express";
import { Settings } from "../models/settings.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { IUser } from "../models/user.model.js";

export const getSettings = async (req: Request, res: Response) => {
    try {
        const user = req.user as IUser;
        if (!user || !user._id) {
            return res.status(401).json(new ApiResponse(401, null, "User not authenticated"));
        }

        let settings = await Settings.findOne({ user: user._id });
        if (!settings) {
            // Return empty/default if not found
            settings = new Settings({ user: user._id });
        }

        return res.status(200).json(
            new ApiResponse(200, settings, "Settings retrieved successfully")
        );
    } catch (error: any) {
        return res.status(500).json(new ApiResponse(500, null, error.message));
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const user = req.user as IUser;
        if (!user || !user._id) {
            return res.status(401).json(new ApiResponse(401, null, "User not authenticated"));
        }

        const { editor, appearance, snippets } = req.body;

        let settings = await Settings.findOne({ user: user._id });

        if (!settings) {
            settings = new Settings({ user: user._id });
        }

        if (editor) settings.editor = { ...settings.editor, ...editor };
        if (appearance) settings.appearance = { ...settings.appearance, ...appearance };
        if (snippets) {
            // Snippets is a Map. If the payload provides it as an object mapping lang to raw json:
            Object.keys(snippets).forEach(lang => {
                settings!.snippets.set(lang, snippets[lang]);
            });
        }

        await settings.save();

        return res.status(200).json(
            new ApiResponse(200, settings, "Settings updated successfully")
        );
    } catch (error: any) {
        return res.status(500).json(new ApiResponse(500, null, error.message));
    }
};
