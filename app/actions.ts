'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeDrawing(imageBase64: string, prompt: string) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Remove data URL prefix and create proper binary data
        const base64Data = imageBase64.split(',')[1];

        const result = await model.generateContent([
            {
                text: prompt,
            },
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/png",
                },
            },
        ]);

        const response = await result.response;
        return { success: true, text: response.text() };
    } catch (error) {
        // Use a specific error type or fallback to unknown
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred.';
        console.error('Error analyzing drawing:', errorMessage);

        return {
            success: false,
            text: `Failed to analyze drawing: ${errorMessage}`,
        };
    }
}
