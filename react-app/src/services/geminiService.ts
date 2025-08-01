// react-app/src/services/geminiService.ts - FINAL, PRODUCTION-READY & FULLY CORRECTED

import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold
} from "@google/generative-ai";
import type {
    GenerationConfig,
    GenerativeModel
} from "@google/generative-ai";

class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;
    private isInitialized = false;

    private readonly MODEL_NAME = "gemini-1.5-flash";
    private readonly API_VERSION = "v1beta";

    private readonly generationConfig: GenerationConfig = {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
    };

    private readonly safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    public initialize(apiKey: string): void {
        if (!apiKey) {
            console.error("[GeminiService] Initialization failed: API key is missing.");
            this.isInitialized = false;
            return;
        }

        if (this.isInitialized) {
            return;
        }

        try {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME }, { apiVersion: this.API_VERSION });
            this.isInitialized = true;
            console.log(`[GeminiService] Initialized successfully with model: ${this.MODEL_NAME}`);
        } catch (error) {
            console.error("[GeminiService] Failed to initialize GoogleGenerativeAI:", error);
            this.isInitialized = false;
        }
    }

    public async generateResponse(prompt: string): Promise<string> {
        if (!this.isInitialized || !this.model) {
            console.error("[GeminiService] Cannot generate response: service not initialized.");
            throw new Error("The AI service is not properly configured. Please check the API key.");
        }

        try {
            const chat = this.model.startChat({
                generationConfig: this.generationConfig,
                safetySettings: this.safetySettings,
                history: [],
            });

            const result = await chat.sendMessage(prompt);
            const response = result.response;
            
            if (response && typeof response.text === 'function') {
                return response.text();
            } else {
                const blockReason = response?.promptFeedback?.blockReason;
                console.warn(`[GeminiService] Response was empty or invalid. Block Reason: ${blockReason || 'Unknown'}`);
                return "I am unable to respond to that prompt due to my safety guidelines. Please try a different topic.";
            }

        } catch (error: any) {
            console.error("[GeminiService] Error generating response:", error);
            const message = error.message || "An unknown error occurred while communicating with the AI service.";
            throw new Error(message);
        }
    }
}

export const jarvisService = new GeminiService();