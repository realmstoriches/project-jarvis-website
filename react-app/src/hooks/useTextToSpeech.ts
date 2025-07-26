// /docs/Jarvis3.5/hooks/useTextToSpeech.ts

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
    if (availableVoices.length === 0) return; // Voices not loaded yet.

    // Determine which of our preferred profiles are actually available in the browser.
    const supportedVoices = VOICE_PROFILES.map(profile => {
      const foundVoice = availableVoices.find(v => v.voiceURI === profile.voiceURI && v.lang.startsWith('en'));
      return foundVoice ? profile : null;
    }).filter((v): v is VoiceProfile => v !== null);

    setVoices(supportedVoices);

    // *** UPGRADED LOGIC: Find the best available voice ***
    // If a voice hasn't been manually selected by the user yet, find the best one.
    if (!selectedVoice) {
      let bestMatch: VoiceProfile | null = null;
      // VOICE_PROFILES is already sorted by preference.
      // Find the first profile that is also in our list of supported voices.
      for (const profile of VOICE_PROFILES) {
        const found = supportedVoices.find(s => s.voiceURI === profile.voiceURI);
        if (found) {
          bestMatch = found;
          break; // Found the highest-ranking available voice, so we can stop.
        }
      }
      setSelectedVoice(bestMatch || supportedVoices[0] || null); // Set best match, or fallback to first available.
    }
    
    setIsReady(true);
  }, [selectedVoice]); // Dependency on selectedVoice ensures this runs once to set default, but not again if user changes voice.

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        populateVoiceList();
        // The 'voiceschanged' event is crucial because getVoices() can be async.
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
    // Find the actual SpeechSynthesisVoice object to use.
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

    window.speechSynthesis.cancel(); // Prevent queuing/overlapping speech
    window.speechSynthesis.speak(utterance);

  }, [selectedVoice]);

  return { isSpeaking, speak, voices, isReady, selectedVoice, setSelectedVoice };
};