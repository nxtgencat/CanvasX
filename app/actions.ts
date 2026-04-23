'use server';

import { GoogleGenAI } from '@google/genai';

export async function analyzeDrawing(imageBase64: string, prompt: string) {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

        // Remove data URL prefix and create proper binary data
        const base64Data = imageBase64.split(',')[1];

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                data: base64Data,
                                mimeType: 'image/png',
                            },
                        },
                    ],
                },
            ],
        });

        return { success: true, text: response.text ?? '' };
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
