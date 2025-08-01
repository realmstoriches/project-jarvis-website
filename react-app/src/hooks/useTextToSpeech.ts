// react-app/src/hooks/useTextToSpeech.ts - CORRECTED, FINAL, PRODUCTION-READY

import { useState, useEffect, useCallback } from 'react';
import type { VoiceProfile } from '../types';
import { VOICE_PROFILES } from '../constants';

/**
 * @file A custom hook for managing text-to-speech (TTS) functionality.
 * @description Encapsulates the logic for finding available voices,
 * synthesizing speech, and managing the state of the speech engine.
 */
export const useTextToSpeech = () => {
  const [isReady, setIsReady] = useState(false);
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile | null>(null);

  const populateVoiceList = useCallback(() => {
    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length === 0) {
      return;
    }

    const supportedVoices: VoiceProfile[] = VOICE_PROFILES.map(profile => {
      const foundVoice = availableVoices.find(v => v.voiceURI === profile.voiceURI && v.lang === profile.lang);
      return foundVoice ? profile : null;
    }).filter((v): v is VoiceProfile => v !== null);

    if (supportedVoices.length > 0) {
        setVoices(supportedVoices);
        setSelectedVoice(supportedVoices[0]);
    }

    setIsReady(true);
  }, []);

  useEffect(() => {
    window.speechSynthesis.addEventListener('voiceschanged', populateVoiceList);
    populateVoiceList();

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', populateVoiceList);
    };
  }, [populateVoiceList]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    // CORRECTED: Block braces added to single-line if statement.
    if (isReady === false || selectedVoice === null) {
      // CORRECTED: Block braces added to nested single-line if statement.
      if (onEnd) {
        onEnd();
      }
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const systemVoice = window.speechSynthesis.getVoices().find(v => v.voiceURI === selectedVoice.voiceURI);

    // This statement was already correct, but verified.
    if (systemVoice) {
        utterance.voice = systemVoice;
        utterance.lang = selectedVoice.lang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // CORRECTED: Block braces added to single-line if statement.
        if (onEnd) {
            utterance.onend = onEnd;
        }

        window.speechSynthesis.speak(utterance);
    }
  }, [isReady, selectedVoice]);

  return { isReady, voices, selectedVoice, setSelectedVoice, speak };
};