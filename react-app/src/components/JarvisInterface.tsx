// react-app/src/components/JarvisInterface.tsx - FINAL, PRODUCTION-READY & FULLY CORRECTED

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { useAuth } from '../context/AuthContext';
import { NeuralNetwork } from './NeuralNetwork';
import { ChatWindow } from './ChatWindow';
import { InputBar } from './InputBar';
import { Dashboard } from './Dashboard';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { jarvisService } from '../services/geminiService';
import type { Message, AIState, SystemStatus, UnlockedUpgrades } from '../types';
import { INITIAL_MESSAGES } from '../constants';

export const JarvisInterface: React.FC = () => {
    const { user, isAuthenticated, isUsageLimitReached } = useAuth();
    const navigate = useNavigate(); // CORRECTED: useNavigate is now correctly called here.
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [aiState, setAiState] = useState<AIState>('idle');
    const [systemStatus, setSystemStatus] = useState<SystemStatus>({ cognitiveLoad: 0, apiUsage: 0, systemStability: 100 });
    const [unlockedUpgrades, setUnlockedUpgrades] = useState<UnlockedUpgrades>({ continuousConversation: false, stabilityPatch: false });
    const hasInitializedChat = useRef(false);
    
    const { speak, voices, isReady: ttsIsReady, selectedVoice, setSelectedVoice } = useTextToSpeech();
    
    const { isListening, startListening } = useSpeechRecognition(
        () => { setAiState('listening'); },
        (transcript) => {
            setAiState('idle');
            if (transcript) {
                processUserMessage(transcript);
            }
        }
    );

    const unlockedUpgradesRef = useRef(unlockedUpgrades);
    unlockedUpgradesRef.current = unlockedUpgrades;
    const isUsageLimitReachedRef = useRef(isUsageLimitReached);
    isUsageLimitReachedRef.current = isUsageLimitReached;

    const handleNewMessage = useCallback((text: string, sender: 'user' | 'JARVIS' = 'JARVIS') => {
        const newMessage: Message = { id: `${Date.now()}-${Math.random()}`, text, sender, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, newMessage]);

        if (sender === 'JARVIS') {
            setAiState('speaking');
            speak(text, () => {
                setAiState('idle');
                if (unlockedUpgradesRef.current.continuousConversation && !isUsageLimitReachedRef.current) {
                    startListening();
                }
            });
        }
    }, [speak, startListening]);

    const processUserMessage = useCallback(async (text: string) => {
        if (!text.trim()) {
            return;
        }
        if (isUsageLimitReached) {
            handleNewMessage("Usage limit reached. Please log in or subscribe to continue.", 'JARVIS');
            return;
        }
        if (!isAuthenticated) {
            window.parent.postMessage({ type: 'GUEST_MESSAGE_SENT' }, window.origin);
        }
        setAiState('thinking');
        setSystemStatus(s => ({ ...s, cognitiveLoad: Math.min(100, s.cognitiveLoad + 30) }));
        setMessages(prev => [...prev, { id: `${Date.now()}`, text, sender: 'user', timestamp: new Date().toISOString() }]);
        try {
            const jarvisResponse = await jarvisService.generateResponse(text);
            setSystemStatus(s => ({ ...s, apiUsage: s.apiUsage + 1, cognitiveLoad: Math.max(0, s.cognitiveLoad - 20) }));
            if (jarvisResponse.includes("continuous conversation mode")) {
                setUnlockedUpgrades(u => ({ ...u, continuousConversation: true }));
            }
            if (jarvisResponse.includes("re-calibration sequence")) {
                setUnlockedUpgrades(u => ({ ...u, stabilityPatch: true }));
            }
            if (jarvisResponse.includes("malfunction")) {
                setSystemStatus(s => ({ ...s, systemStability: Math.max(0, s.systemStability - 25) }));
            }
            handleNewMessage(jarvisResponse);
        } catch (error) {
            console.error("[JarvisInterface] Error from Gemini service:", error);
            handleNewMessage("I'm encountering a communication error. Please check the console for details.", 'JARVIS');
            setAiState('idle');
        }
    }, [isAuthenticated, isUsageLimitReached, handleNewMessage]);

    const initializeChat = useCallback(() => {
        if (!hasInitializedChat.current && INITIAL_MESSAGES.length > 0) {
            hasInitializedChat.current = true;
            const initialMessage = INITIAL_MESSAGES[0];
            setMessages([initialMessage]);
            setAiState('speaking');
            speak(initialMessage.text, () => {
                setAiState('idle');
            });
        }
    }, [speak]);

    useEffect(() => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        if (!apiKey) {
            console.error("CRITICAL: VITE_GEMINI_API_KEY is not set.");
        }
        jarvisService.initialize(apiKey);
    }, []);

    useEffect(() => {
        if (ttsIsReady) {
            initializeChat();
        }
    }, [ttsIsReady, initializeChat]);

    const handleStabilityPatch = () => {
        setSystemStatus(s => ({ ...s, systemStability: 100 }));
        setUnlockedUpgrades(u => ({ ...u, stabilityPatch: false }));
        handleNewMessage("Re-calibration complete. System stability restored to 100%.");
    };

    const isInputReady = aiState === 'idle' && !isListening && !isUsageLimitReached;

    return (
        <>
            <Canvas camera={{ position: [0, 0, 15], fov: 75 }} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
                <NeuralNetwork aiState={aiState}>
                    <ChatWindow messages={messages} />
                    <Dashboard
                        user={user}
                        isAuthenticated={isAuthenticated}
                        onNavigateToLogin={() => navigate('/login')}
                        status={systemStatus}
                        upgrades={unlockedUpgrades}
                        voices={voices}
                        selectedVoice={selectedVoice}
                        onVoiceChange={setSelectedVoice}
                        onPatch={handleStabilityPatch}
                        onToggleContinuous={v => setUnlockedUpgrades(u => ({ ...u, continuousConversation: v }))}
                        isContinuousConversationOn={unlockedUpgrades.continuousConversation}
                    />
                </NeuralNetwork>
            </Canvas>
            <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center z-10">
                <InputBar
                    onSendMessage={processUserMessage}
                    onVoiceStart={startListening}
                    isReady={isInputReady}
                    isUsageLimitReached={isUsageLimitReached}
                />
            </div>
        </>
    );
};