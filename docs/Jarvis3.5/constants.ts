// /docs/Jarvis3.5/constants.ts

import { VoiceProfile } from './types';

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

  // Standard high-quality macOS voice
  { name: 'Samantha', voiceURI: 'Samantha', lang: 'en-US' },
  { name: 'Alex', voiceURI: 'Alex', lang: 'en-US' },

  // Standard high-quality UK voices (as alternatives)
  { name: 'Google UK English Female', voiceURI: 'Google UK English Female', lang: 'en-GB' },
  { name: 'Google UK English Male', voiceURI: 'Google UK English Male', lang: 'en-GB' },
  { name: 'Daniel', voiceURI: 'Daniel', lang: 'en-GB' },

  // Fallback default system voices
  { name: 'Microsoft Mark - English (United States)', voiceURI: 'Microsoft Mark - English (United States)', lang: 'en-US'},
  { name: 'Fred', voiceURI: 'Fred', lang: 'en-US' },
];