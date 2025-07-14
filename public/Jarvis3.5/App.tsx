
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { NeuralNetwork } from './components/NeuralNetwork';
import { ChatWindow } from './components/ChatWindow';
import { InputBar } from './components/InputBar';
import { Dashboard } from './components/Dashboard';
import { Modal } from './components/common/Modal';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { jarvisService } from './services/geminiService';
import type { Message, AIState, SystemStatus, UnlockedUpgrades, VoiceProfile } from './types';
import { INITIAL_MESSAGES } from './constants';

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiState, setAiState] = useState<AIState>('idle');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    cognitiveLoad: 0,
    apiUsage: 0,
    systemStability: 100,
  });

  const [unlockedUpgrades, setUnlockedUpgrades] = useState<UnlockedUpgrades>({
    continuousConversation: false,
    stabilityPatch: false,
  });

  const hasInitializedChat = useRef(false);

  const {
    isSpeaking,
    speak,
    voices,
    isReady: ttsIsReady,
    selectedVoice,
    setSelectedVoice,
  } = useTextToSpeech();

  const handleNewMessage = useCallback(async (text: string, sender: 'user' | 'JARVIS' = 'JARVIS') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);

    if (sender === 'JARVIS') {
        setAiState('speaking');
        speak(text, () => {
            setAiState('idle');
            if(unlockedUpgrades.continuousConversation) {
                startListening();
            }
        });
    }
  }, [speak, unlockedUpgrades.continuousConversation]);

  const processUserMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setAiState('thinking');
    setSystemStatus(s => ({ ...s, cognitiveLoad: Math.min(100, s.cognitiveLoad + 30) }));

    const userMessage: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);

    const jarvisResponse = await jarvisService.generateResponse(text);

    setSystemStatus(s => ({...s, apiUsage: s.apiUsage + 1, cognitiveLoad: Math.max(0, s.cognitiveLoad - 30)}));
    
    // Check for self-upgrade commands
    if (jarvisResponse.includes("continuous conversation mode") && jarvisResponse.includes("Shall I proceed?")) {
        setUnlockedUpgrades(u => ({...u, continuousConversation: true}));
    }
    if (jarvisResponse.includes("re-calibration sequence") && jarvisResponse.includes("Do I have your authorization?")) {
        setUnlockedUpgrades(u => ({...u, stabilityPatch: true}));
    }

    // Handle errors degrading stability
    if (jarvisResponse.includes("malfunction") || jarvisResponse.includes("rejected")) {
      setSystemStatus(s => ({...s, systemStability: Math.max(0, s.systemStability - 25)}));
    }

    handleNewMessage(jarvisResponse);
  }, [handleNewMessage]);
  
  const { isListening, startListening } = useSpeechRecognition(
    () => setAiState('listening'),
    (transcript) => {
      setAiState('idle');
      if (transcript) {
        processUserMessage(transcript);
      }
    }
  );

  const initializeChat = useCallback(() => {
    if (messages.length > 0) return;
    const initialMessage = INITIAL_MESSAGES[0];
    setMessages([initialMessage]);
    setAiState('speaking');
    speak(initialMessage.text, () => {
      setAiState('idle');
    });
  }, [speak, messages.length]);


  // Effect for API Key handling
  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      jarvisService.initialize(storedApiKey);
      setIsAuthenticated(true);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const handleApiKeySubmit = (key: string) => {
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      setApiKey(key);
      jarvisService.initialize(key);
      setShowApiKeyModal(false);
      setIsAuthenticated(true);
    }
  };

  // The patched initialization effect
  useEffect(() => {
    if (isAuthenticated && ttsIsReady && !hasInitializedChat.current) {
        initializeChat();
        hasInitializedChat.current = true;
    }
  }, [isAuthenticated, ttsIsReady, initializeChat]);

  // Prevent interaction while modals are up or AI is busy
  const isInteractive = aiState !== 'speaking' && aiState !== 'thinking' && !isListening;

  const handleStabilityPatch = () => {
    setSystemStatus(s => ({...s, systemStability: 100}));
    setUnlockedUpgrades(u => ({...u, stabilityPatch: false}));
    handleNewMessage("Re-calibration complete. System stability restored to 100%.");
  }

  return (
    <div className="w-screen h-screen bg-black">
      <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
        <NeuralNetwork aiState={aiState}>
          <ChatWindow messages={messages} />
          <Dashboard
            status={systemStatus}
            upgrades={unlockedUpgrades}
            voices={voices}
            selectedVoice={selectedVoice}
            onVoiceChange={(v) => setSelectedVoice(v as VoiceProfile)}
            onPatch={handleStabilityPatch}
            onToggleContinuous={v => setUnlockedUpgrades(u => ({...u, continuousConversation: v}))}
            isContinuousConversationOn={unlockedUpgrades.continuousConversation}
          />
        </NeuralNetwork>
      </Canvas>
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
        {isAuthenticated && <InputBar onSendMessage={processUserMessage} onVoiceStart={startListening} isReady={isInteractive} />}
      </div>
      {showApiKeyModal && (
        <Modal title="Enter Gemini API Key" onClose={() => {}}>
            <div className="p-4 text-gray-300">
                <p className="mb-4">Please enter your Google Gemini API key to activate J.A.R.V.I.S.</p>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.target as HTMLFormElement).elements.namedItem('apiKey') as HTMLInputElement;
                    handleApiKeySubmit(input.value);
                }}>
                    <input
                        id="apiKey"
                        type="password"
                        className="w-full px-3 py-2 bg-gray-900 border border-cyan-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        placeholder="Enter your API key"
                    />
                    <button type="submit" className="w-full mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors">
                        Activate
                    </button>
                </form>
            </div>
        </Modal>
      )}
    </div>
  );
}