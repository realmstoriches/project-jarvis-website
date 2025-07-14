
import { GoogleGenerativeAI } from '@google/generative-ai';
import { JARVIS_CONSTITUTION } from '../constants';

class JarvisService {
  private ai: InstanceType<typeof GoogleGenerativeAI> | null = null;
  private chat: any = null; // Using 'any' temporarily, will be the return type of model.startChat()

  initialize(apiKey: string) {
    if (!this.ai) {
      this.ai = new GoogleGenerativeAI(apiKey);
      const model = this.ai.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });
      
      // Initialize chat without system instruction first
      this.chat = model.startChat();
      
      // Then send the constitution as the first message
      if (this.chat) {
        this.chat.sendMessage(JARVIS_CONSTITUTION)
          .catch((error: Error) => {
            console.error("Error setting up JARVIS constitution:", error);
          });
      }
    }
  }

  isInitialized(): boolean {
    return !!this.ai && !!this.chat;
  }

  async generateResponse(prompt: string): Promise<string> {
    if (!this.chat) {
      console.error("JARVIS service not initialized. Please provide an API key.");
      return "JARVIS initialization error. Please provide a valid API key in the settings.";
    }

    try {
      console.log("Sending to Gemini:", prompt);
      
      // Try to use the existing chat session
      let response;
      try {
        response = await this.chat.sendMessage(prompt);
      } catch (sessionError) {
        console.warn("Chat session error, creating a new session:", sessionError);
        
        // If the chat session fails, create a new one and try again
        const model = this.ai!.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.chat = model.startChat();
        response = await this.chat.sendMessage(prompt);
      }
      
      const text = response.response.text();
      console.log("Received from Gemini:", text);
      return text;
    } catch (error) {
      console.error("Error communicating with Gemini API:", error);
      
      // More detailed error handling
      if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
          return "My connection to the cognitive core has been rejected. The API Key appears to be invalid. Please verify it in the dashboard.";
        } else if (error.message.includes('400 Bad Request')) {
          return "Creator, I'm experiencing a configuration issue. Please check the console for more details and verify your API key is correctly set up.";
        } else if (error.message.includes('429')) {
          return "Creator, I've reached my rate limit with the Gemini API. Please try again in a moment.";
        }
      }
      
      return "Creator, I am experiencing a malfunction in my cognitive core. I am unable to process that request at this time. Please check the browser console for more details.";
    }
  }
}

export const jarvisService = new JarvisService();