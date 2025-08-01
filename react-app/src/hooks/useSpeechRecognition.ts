// react-app/src/hooks/useSpeechRecognition.ts - THE FINAL, CORRECT, PRODUCTION-READY VERSION

import { useState, useEffect, useRef, useCallback } from 'react';

// --- SELF-CONTAINED TYPE DEFINITIONS for the Web Speech API ---
// This approach guarantees the types exist, regardless of the global environment,
// solving the "type not found" errors permanently.

interface ISpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly [index: number]: { readonly transcript: string };
}

interface ISpeechRecognitionEvent extends Event {
    readonly results: ISpeechRecognitionResult[];
}

interface ISpeechRecognitionErrorEvent extends Event {
    readonly error: string;
}

// Defines the interface for the SpeechRecognition instance itself.
interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => any) | null;
    onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => any) | null;
}

// Defines the type for the SpeechRecognition constructor.
interface ISpeechRecognitionConstructor {
    new (): ISpeechRecognition;
}

// Declares the window object with our vendor-prefixed properties.
declare global {
  interface Window {
    SpeechRecognition: ISpeechRecognitionConstructor;
    webkitSpeechRecognition: ISpeechRecognitionConstructor;
  }
}

// The public interface for our hook.
export interface SpeechRecognitionHook {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  permissionGranted: boolean | null;
}

/**
 * @file A custom hook for managing speech-to-text recognition.
 * @description Provides a robust, type-safe, and production-ready interface for the Web Speech API.
 * @param {() => void} onStart - Callback executed when recognition begins.
 * @param {(transcript: string) => void} onEnd - Callback executed with the final transcript.
 * @returns {SpeechRecognitionHook} An object containing state and control functions.
 */
export const useSpeechRecognition = (
    onStart: () => void,
    onEnd: (transcript: string) => void
): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Use refs to hold the latest callbacks, preventing stale closures in the effect.
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    if (navigator.permissions) {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
            setPermissionGranted(permissionStatus.state === 'granted');
            permissionStatus.onchange = () => {
                 setPermissionGranted(permissionStatus.state === 'granted');
            };
        });
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      onStartRef.current();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError("Microphone access denied. Please enable it in your browser settings.");
        setPermissionGranted(false);
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const finalTranscript = event.results[last][0].transcript.trim();
      onEndRef.current(finalTranscript);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      }
    };
  }, []); // This effect runs only once.

  const startListening = useCallback(() => {
    if (recognitionRef.current && isListening === false) {
      try {
        setError(null);
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error starting recognition:", err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening === true) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return { isListening, startListening, stopListening, error, permissionGranted };
};