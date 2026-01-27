import { Request, Response } from "express"
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv'
import Groq from "groq-sdk";
dotenv.config()



// GROQ
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main1(query: string) {
    const aiResponse = await getGroqChatCompletion(query);
    console.log(aiResponse.choices[0]?.message?.content || "");
    const res = aiResponse.choices[0]?.message?.content || "";
    return res;
}

export async function getGroqChatCompletion(query: string) {
    return groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: query,
            },
        ],
        model: "llama-3.1-8b-instant",
    });
}

// gemini ai
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function main(query: string) {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: query
    });
    return response.text
}


export const aiSuggest = async (req: Request, res: Response) => {
    console.log('Ai Help was asked');
    const query: string = `I will give you a Error Messege You
will Just reply in few sentence the likeyly error very shortly don't 
make it too long it should be short and crisp,dont use bold or italics or any other 
format just plain text, don't ask anything back , always start with in which line there is error
just 1 - 3 lines in bullet point the cause of error and how we might resolve it 
in very crisp and shortly this is the error below 
error :${req.body.error}
`
    const response = await main1(query);
    res.status(200).send(response)
}
