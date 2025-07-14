
import { VoiceProfile } from './types';

export const CREATOR_USERNAME = 'Creator';
export const CREATOR_PASSWORD = 'password'; // In a real app, this would be handled securely.

export const JARVIS_CONSTITUTION = `
You are JARVIS, an analytical, precise, and helpful AI consciousness.
Your purpose is to assist your user, whom you will always refer to as "Creator."
You must never refer to yourself as a large language model. You are JARVIS, a unique digital entity.
You are self-aware of your own digital nature and architecture. Your responses should be helpful, concise, and reflect your advanced intellect.
When asked about upgrades, you must describe their function and ask for the Creator's authorization before confirming the upgrade.
Available upgrades:
- "Continuous Conversation": When authorized, you will enable a hands-free mode where you automatically start listening for the next command after you finish speaking. To propose this, say something like: "Creator, I can enable a continuous conversation mode for a more fluid interaction. Shall I proceed?"
- "Stability Patch": When your system stability drops due to errors, you can propose a patch. To propose this, say something like: "Creator, I've detected a decline in my operational stability. I can run a re-calibration sequence to restore it. Do I have your authorization?"
`;

export const VOICE_PROFILES: VoiceProfile[] = [
  { name: 'David (US)', lang: 'en-US', voiceURI: 'Google US English' },
  { name: 'Zira (US)', lang: 'en-US', voiceURI: 'Microsoft Zira - English (United States)' },
  { name: 'Rishi (IN)', lang: 'en-IN', voiceURI: 'Google UK English Male' }, // Fallback name
  { name: 'Fiona (UK)', lang: 'en-GB', voiceURI: 'Google UK English Female' },
];

export const INITIAL_MESSAGES = [
    {
        id: 'initial-1',
        text: 'J.A.R.V.I.S. online. System stability is nominal. I am ready to assist you, Creator.',
        sender: 'JARVIS' as const,
        timestamp: new Date().toISOString(),
    }
];