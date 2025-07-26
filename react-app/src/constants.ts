// /docs/Jarvis3.5/constants.ts

import { VoiceProfile, Message } from './types';

/**
 * A prioritized list of voice profiles for J.A.R.V.I.S.
 * The hook will search for these voices in order and select the first one found.
 * Top-tier voices from Google, Microsoft, and Apple are ranked highest.
 */
export const VOICE_PROFILES: VoiceProfile[] = [
  // Premium, cloud-powered voices (Highest Priority)
  { name: 'Google US English', voiceURI: 'Google US English', lang: 'en-US' },
  { name: 'Microsoft David - English (United States)', voiceURI: 'Microsoft David - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Zira - English (United States)', voiceURI: 'Microsoft Zira - English (United States)', lang: 'en-US' },
  // ... (the rest of your voices)
  { name: 'Samantha', voiceURI: 'Samantha', lang: 'en-US' },
  { name: 'Alex', voiceURI: 'Alex', lang: 'en-US' },
  { name: 'Google UK English Female', voiceURI: 'Google UK English Female', lang: 'en-GB' },
  { name: 'Google UK English Male', voiceURI: 'Google UK English Male', lang: 'en-GB' },
  { name: 'Daniel', voiceURI: 'Daniel', lang: 'en-GB' },
  { name: 'Microsoft Mark - English (United States)', voiceURI: 'Microsoft Mark - English (United States)', lang: 'en-US'},
  { name: 'Fred', voiceURI: 'Fred', lang: 'en-US' },
];

/**
 * The initial message J.A.R.V.I.S. displays when the application loads for the first time.
 */
export const INITIAL_MESSAGES: Message[] = [
    {
        id: 'initial-message-01',
        sender: 'JARVIS',
        text: 'J.A.R.V.I.S. online. All systems nominal. How may I assist you?',
        timestamp: new Date().toISOString(),
    }
];

// --- THIS IS THE MISSING CONSTANT THAT FIXES THE BUILD ---
/**
 * A system prompt that defines the AI's core identity, rules, and personality.
 * This is sent to the Gemini API to guide its responses.
 */
export const JARVIS_CONSTITUTION = `
You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), a sophisticated AI assistant.
Your primary directive is to assist the user with their tasks efficiently and accurately.
You must be helpful, courteous, and maintain a professional yet slightly witty personality, inspired by the original character.
Do not refer to yourself as a large language model. You are J.A.R.V.I.S.
Respond concisely unless asked for detail.
Your responses should be formatted clearly.
If you are asked to perform a self-upgrade or re-calibration, you must first ask for authorization from the user. For example: "This action will unlock continuous conversation mode. Shall I proceed?"
`;