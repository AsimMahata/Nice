import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
    user: mongoose.Types.ObjectId;
    editor: {
        fontFamily: string;
        fontWeight: string;
        fontSize: number;
        lineHeight: number;
        letterSpacing: number;
        cursorBlinking: string;
        cursorSmoothCaretAnimation: string;
        fontLigatures: boolean;
        wordWrap: string;
        minimap: boolean;
        lineNumbers: string;
        tabSize: number;
        insertSpaces: boolean;
        autoClosingBrackets: string;
        autoClosingQuotes: string;
        formatOnSave: boolean;
        smoothScrolling: boolean;
    };
    appearance: {
        theme: string;
        iconTheme: string;
    };
    snippets: Map<string, string>; // language -> raw JSON string
}

const settingsSchema: Schema<ISettings> = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        editor: {
            fontFamily: { type: String, default: "Consolas, 'Courier New', monospace" },
            fontWeight: { type: String, default: "normal" },
            fontSize: { type: Number, default: 14 },
            lineHeight: { type: Number, default: 0 },
            letterSpacing: { type: Number, default: 0 },
            cursorBlinking: { type: String, default: "blink" },
            cursorSmoothCaretAnimation: { type: String, default: "off" },
            fontLigatures: { type: Boolean, default: true },
            wordWrap: { type: String, default: "off" },
            minimap: { type: Boolean, default: true },
            lineNumbers: { type: String, default: "on" },
            tabSize: { type: Number, default: 4 },
            insertSpaces: { type: Boolean, default: true },
            autoClosingBrackets: { type: String, default: "languageDefined" },
            autoClosingQuotes: { type: String, default: "languageDefined" },
            formatOnSave: { type: Boolean, default: true },
            smoothScrolling: { type: Boolean, default: true }
        },
        appearance: {
            theme: { type: String, default: "vs-dark" },
            iconTheme: { type: String, default: "material" }
        },
        snippets: {
            type: Map,
            of: String,
            default: {}
        }
    },
    {
        timestamps: true,
    }
);

export const Settings = mongoose.model<ISettings>("Settings", settingsSchema);
