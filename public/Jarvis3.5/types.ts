
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'JARVIS';
  timestamp: string;
}

export type AIState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface VoiceProfile {
  name: string;
  lang: string;
  voiceURI: string;
}

export interface UnlockedUpgrades {
  continuousConversation: boolean;
  stabilityPatch: boolean;
}

export interface SystemStatus {
  cognitiveLoad: number;
  apiUsage: number;
  systemStability: number;
}