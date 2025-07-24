import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useAuth } from '../context/AuthContext';
import { NeuralNetwork } from './NeuralNetwork';
import { ChatWindow } from './ChatWindow';
import { InputBar } from './InputBar';
import { Dashboard } from './Dashboard';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { jarvisService } from '../services/geminiService';
import type { Message, AIState, SystemStatus, UnlockedUpgrades, VoiceProfile } from '../types';
import { INITIAL_MESSAGES } from '../constants';

export const JarvisInterface = () => {
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
    const { isSpeaking, speak, voices, isReady: ttsIsReady, selectedVoice, setSelectedVoice } = useTextToSpeech();

    const handleNewMessage = useCallback((text: string, sender: 'user' | 'JARVIS' = 'JARVIS') => {
        const newMessage: Message = { id: Date.now().toString(), text, sender, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, newMessage]);
        if (sender === 'JARVIS') {
            setAiState('speaking');
            speak(text, () => {
                setAiState('idle');
                if (unlockedUpgrades.continuousConversation) {
                    startListening();
                }
            });
        }
    }, [speak, unlockedUpgrades.continuousConversation, startListening]);

    const processUserMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setAiState('thinking');
        setSystemStatus(s => ({ ...s, cognitiveLoad: Math.min(100, s.cognitiveLoad + 30) }));
        const userMessage: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMessage]);
        const jarvisResponse = await jarvisService.generateResponse(text);
        setSystemStatus(s => ({ ...s, apiUsage: s.apiUsage + 1, cognitiveLoad: Math.max(0, s.cognitiveLoad - 30) }));
        if (jarvisResponse.includes("continuous conversation mode")) setUnlockedUpgrades(u => ({ ...u, continuousConversation: true }));
        if (jarvisResponse.includes("re-calibration sequence")) setUnlockedUpgrades(u => ({ ...u, stabilityPatch: true }));
        if (jarvisResponse.includes("malfunction")) setSystemStatus(s => ({ ...s, systemStability: Math.max(0, s.systemStability - 25) }));
        handleNewMessage(jarvisResponse);
    }, [handleNewMessage]);

    const { isListening, startListening } = useSpeechRecognition(() => setAiState('listening'), (transcript) => {
        setAiState('idle');
        if (transcript) processUserMessage(transcript);
    });

    const initializeChat = useCallback(() => {
        if (messages.length > 0) return;
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
        if (isAuthenticated) {
            jarvisService.initialize(process.env.REACT_APP_GEMINI_API_KEY || '');
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && ttsIsReady && !hasInitializedChat.current) {
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