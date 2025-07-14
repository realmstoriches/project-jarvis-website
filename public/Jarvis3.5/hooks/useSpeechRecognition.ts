
import { useState, useEffect, useRef, useCallback } from 'react';

// The SpeechRecognition interface is not standard on all browsers, so we declare it.
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  permissionGranted: boolean | null;
}

export const useSpeechRecognition = (
    onStart: () => void, 
    onEnd: (transcript: string) => void
): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    // Check for permission status
    if (navigator.permissions) {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
            setPermissionGranted(permissionStatus.state === 'granted');
            permissionStatus.onchange = () => {
                 setPermissionGranted(permissionStatus.state === 'granted');
            };
        });
    }


    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      onStart();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError("Microphone access denied. Please enable it in your browser settings.");
        setPermissionGranted(false);
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };
    
    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const finalTranscript = event.results[last][0].transcript.trim();
      setTranscript(finalTranscript);
      onEnd(finalTranscript);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onStart, onEnd]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        setError(null);
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error starting recognition:", err);
        // This can happen if recognition is already started, which is a race condition.
        // We can ignore it as the state is already `isListening`.
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening, error, permissionGranted };
};