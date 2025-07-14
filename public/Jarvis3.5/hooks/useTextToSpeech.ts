
import { useState, useEffect, useCallback } from 'react';
import { VoiceProfile } from '../types';
import { VOICE_PROFILES } from '../constants';

interface TextToSpeechHook {
  isSpeaking: boolean;
  speak: (text: string, onEnd?: () => void) => void;
  voices: VoiceProfile[];
  isReady: boolean;
  selectedVoice: VoiceProfile | null;
  setSelectedVoice: (voice: VoiceProfile) => void;
}

export const useTextToSpeech = (): TextToSpeechHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile | null>(null);

  const populateVoiceList = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length === 0) return; // Voices not loaded yet

    const supportedVoices = VOICE_PROFILES.map(profile => {
      const foundVoice = availableVoices.find(v => v.voiceURI === profile.voiceURI && v.lang === profile.lang);
      return foundVoice ? profile : null;
    }).filter((v): v is VoiceProfile => v !== null);

    setVoices(supportedVoices);
    // Set a default voice if none is selected
    if (!selectedVoice && supportedVoices.length > 0) {
      setSelectedVoice(supportedVoices[0]);
    }
    setIsReady(true);
  }, [selectedVoice]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        populateVoiceList();
        // Voices may load asynchronously
        window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
  }, [populateVoiceList]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis || !selectedVoice) {
        onEnd?.();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const allVoices = window.speechSynthesis.getVoices();
    const voiceToUse = allVoices.find(v => v.voiceURI === selectedVoice.voiceURI);

    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }
    utterance.lang = selectedVoice.lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      setIsSpeaking(false);
      onEnd?.();
    };

    window.speechSynthesis.cancel(); // Cancel any previous speech
    window.speechSynthesis.speak(utterance);

  }, [selectedVoice]);

  return { isSpeaking, speak, voices, isReady, selectedVoice, setSelectedVoice };
};