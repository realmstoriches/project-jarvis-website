// react-app/src/types.ts - FINAL, PRODUCTION-READY

/**
 * @file Defines all shared TypeScript types for the J.A.R.V.I.S. application.
 * @description This file is the single source of truth for data structures,
 * ensuring type safety and consistency across the entire frontend.
 */

/**
 * Represents the state of the AI's core processing loop.
 * - idle: Awaiting user input.
 * - listening: Actively capturing audio via the microphone.
 * - thinking: Processing user input and generating a response.
 * - speaking: Converting the response text to speech.
 */
export type AIState = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * Defines the structure of a single message in the chat history.
 */
export interface Message {
  id: string;
  sender: 'user' | 'JARVIS';
  text: string;
  timestamp: string; // ISO 8601 date string
}

/**
 * Contains metrics about the AI's current performance and status.
 */
export interface SystemStatus {
  cognitiveLoad: number; // Percentage (0-100)
  apiUsage: number; // A raw count of API calls for the session
  systemStability: number; // Percentage (0-100)
}

/**
 * Tracks which special abilities or features the user has unlocked
 * during their session through interaction.
 */
export interface UnlockedUpgrades {
  continuousConversation: boolean;
  stabilityPatch: boolean;
}

/**
 * Describes a single voice option available for text-to-speech synthesis.
 */
export interface VoiceProfile {
  name: string;
  voiceURI: string;
  lang: string;
}

/**
 * Defines the structure for a user's subscription details,
 * synchronized from the backend (Stripe). The `tier` values
 * should ideally match your Stripe product names for consistency.
 */
export interface Subscription {
  tier: 'free' | 'basic' | 'custom' | 'a gang of ai managers'; // Matches Stripe Pricing Table
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'none';
  stripeCustomerId?: string;
}

/**
 * Represents the authenticated user's data model within the application.
 * This is the central object for managing authorization state.
 */
export interface User {
  id: string;
  email: string;
  subscription: Subscription;
}