// react-app/src/services/geminiService.ts - THE CORRECT AND FINAL VERSION

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { JARVIS_CONSTITUTION } from '../constants';

/**
 * @file Manages all interactions with the Google Gemini API.
 * @description This service uses a class-based singleton pattern to ensure
 * robust state management and a clean, encapsulated interface for the AI model.
 */

// Configuration for the generative model's safety settings.
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const modelConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
};

// DEFINITIVE FIX: Use TypeScript's `InstanceType` utility to correctly derive the
// type of an instance of the `GoogleGenerativeAI` class. This resolves the
// "cannot be used as a type" error permanently.
type AiInstanceType = InstanceType<typeof GoogleGenerativeAI>;

class JarvisService {
    // The AI instance is now correctly typed using the derived type above.
    private aiInstance: AiInstanceType | null = null;

    /**
     * Initializes the GoogleGenerativeAI instance with the provided API key.
     * This must be called once before any other service methods.
     * @param {string} apiKey - The Google Gemini API key.
     */
    public initialize(apiKey: string): void {
        if (!apiKey) {
            console.error("[GeminiService] API Key is missing. J.A.R.V.I.S. will be non-responsive.");
            return;
        }
        this.aiInstance = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Generates a response from the AI based on the user's prompt.
     * @param {string} prompt - The user's input message.
     * @returns {Promise<string>} The AI-generated text response.
     */
    public async generateResponse(prompt: string): Promise<string> {
        if (this.aiInstance === null) {
            throw new Error("Gemini Service not initialized. Call initialize() first.");
        }

        try {
            const model = this.aiInstance.getGenerativeModel({ model: "gemini-1.0-pro", safetySettings });
            const chat = model.startChat({
                generationConfig: modelConfig,
                history: [
                    { role: "user", parts: [{ text: JARVIS_CONSTITUTION }] },
                    { role: "model", parts: [{ text: "Acknowledged. I am J.A.R.V.I.S. Systems online." }] },
                ],
            });

            const result = await chat.sendMessage(prompt);
            return result.response.text();

        } catch (error) {
            console.error("[GeminiService] Error generating response:", error);
            return "My apologies, I am currently unable to process that request due to a connection issue with my core systems.";
        }
    }
}

// Export a single, shared instance of the service for the entire application.
export const jarvisService = new JarvisService();