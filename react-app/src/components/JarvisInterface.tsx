// react-app/src/components/JarvisInterface.tsx - FINAL CORRECTED VERSION

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useAuth } from '../context/AuthContext'; // <-- PATH 1 CORRECTED
import { NeuralNetwork } from './NeuralNetwork';
import { ChatWindow } from './ChatWindow';
import { InputBar } from './InputBar';
import { Dashboard } from './Dashboard';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'; // <-- PATH 2 CORRECTED
import { useTextToSpeech } from '../hooks/useTextToSpeech';       // <-- PATH 3 CORRECTED
import { jarvisService } from '../services/geminiService';       // <-- PATH 4 CORRECTED
import type { Message, AIState, SystemStatus, UnlockedUpgrades, VoiceProfile } from '../types'; // <-- PATH 5 CORRECTED
import { INITIAL_MESSAGES } from '../constants';                  // <-- PATH 6 CORRECTED

export const JarvisInterface: React.FC = () => { // CORRECTED: Added React.FC type for clarity
    const { isAuthenticated } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [aiState, setAiState] = useState<AIState>('idle');
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
    const { speak, voices, isReady: ttsIsReady, selectedVoice, setSelectedVoice } = useTextToSpeech();

    const { isListening, startListening } = useSpeechRecognition(() => setAiState('listening'), (transcript) => {
        setAiState('idle');
        if (transcript) { // CORRECTED: Block braces added
            processUserMessage(transcript);
        }
    });

    const handleNewMessage = useCallback((text: string, sender: 'user' | 'JARVIS' = 'JARVIS') => {
        const newMessage: Message = { id: Date.now().toString(), text, sender, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, newMessage]);
        if (sender === 'JARVIS') { // CORRECTED: Block braces added
            setAiState('speaking');
            speak(text, () => {
                setAiState('idle');
                if (unlockedUpgrades.continuousConversation) { // CORRECTED: Block braces added
                    startListening();
                }
            });
        }
    }, [speak, unlockedUpgrades.continuousConversation, startListening]);

    const processUserMessage = useCallback(async (text: string) => {
        if (!text.trim()) { return; } // CORRECTED: Block braces added
        
        setAiState('thinking');
        setSystemStatus(s => ({ ...s, cognitiveLoad: Math.min(100, s.cognitiveLoad + 30) }));
        const userMessage: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMessage]);
        const jarvisResponse = await jarvisService.generateResponse(text);
        setSystemStatus(s => ({ ...s, apiUsage: s.apiUsage + 1, cognitiveLoad: Math.max(0, s.cognitiveLoad - 30) }));
        
        if (jarvisResponse.includes("continuous conversation mode")) { // CORRECTED: Block braces added
            setUnlockedUpgrades(u => ({ ...u, continuousConversation: true }));
        }
        if (jarvisResponse.includes("re-calibration sequence")) { // CORRECTED: Block braces added
            setUnlockedUpgrades(u => ({ ...u, stabilityPatch: true }));
        }
        if (jarvisResponse.includes("malfunction")) { // CORRECTED: Block braces added
            setSystemStatus(s => ({ ...s, systemStability: Math.max(0, s.systemStability - 25) }));
        }
        
        handleNewMessage(jarvisResponse);
    }, [handleNewMessage]);

    const initializeChat = useCallback(() => {
        if (messages.length > 0) { return; } // CORRECTED: Block braces added

        const initialMessage = INITIAL_MESSAGES[0];
        setMessages([initialMessage]);
        setAiState('speaking');
        speak(initialMessage.text, () => setAiState('idle'));
    }, [speak, messages.length]);

    const handleStabilityPatch = () => {
        setSystemStatus(s => ({ ...s, systemStability: 100 }));
        setUnlockedUpgrades(u => ({ ...u, stabilityPatch: false }));
        handleNewMessage("Re-calibration complete. System stability restored to 100%.");
    };

    useEffect(() => {
        if (isAuthenticated) { // CORRECTED: Block braces added
            // NOTE: process.env.REACT_APP_... is a Create React App convention.
            // Vite uses import.meta.env.VITE_...
            // You should have a .env file in your react-app root with VITE_GEMINI_API_KEY=...
            jarvisService.initialize(import.meta.env.VITE_GEMINI_API_KEY || '');
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && ttsIsReady && !hasInitializedChat.current) { // CORRECTED: Block braces added
            initializeChat();
            hasInitializedChat.current = true;
        }
    }, [isAuthenticated, ttsIsReady, initializeChat]);

    return (
        <>
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
                        onToggleContinuous={v => setUnlockedUpgrades(u => ({ ...u, continuousConversation: v }))}
                        isContinuousConversationOn={unlockedUpgrades.continuousConversation}
                    />
                </NeuralNetwork>
            </Canvas>
            <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
                <InputBar
                    onSendMessage={processUserMessage}
                    onVoiceStart={startListening}
                    isReady={aiState !== 'speaking' && aiState !== 'thinking' && !isListening}
                />
            </div>
        </>
    );
};