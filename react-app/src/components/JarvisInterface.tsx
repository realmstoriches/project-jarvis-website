// react-app/src/components/JarvisInterface.tsx - CORRECTED, FINAL, PRODUCTION-READY

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

/**
 * @file The primary user interface for interacting with J.A.R.V.I.S.
 * @description This component orchestrates the 3D visualization, chat window,
 * dashboard, and all user interactions. It integrates with the AuthContext
 * to enforce the freemium usage model.
 */
export const JarvisInterface: React.FC = () => {
    // --- State and Context Hooks ---
    const { isAuthenticated, isUsageLimitReached, incrementMessageCount } = useAuth();
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
    const { isListening, startListening } = useSpeechRecognition(
        () => setAiState('listening'),
        (transcript) => {
            setAiState('idle');
            if (transcript) {
                processUserMessage(transcript);
            }
        }
    );

    // --- Core Interaction Logic ---

    const handleNewMessage = useCallback((text: string, sender: 'user' | 'JARVIS' = 'JARVIS') => {
        const newMessage: Message = {
            id: `${Date.now()}-${Math.random()}`,
            text,
            sender,
            timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, newMessage]);

        if (sender === 'JARVIS') {
            setAiState('speaking');
            speak(text, () => {
                setAiState('idle');
                if (unlockedUpgrades.continuousConversation === true && isUsageLimitReached === false) {
                    startListening();
                }
            });
        }
    }, [speak, unlockedUpgrades.continuousConversation, startListening, isUsageLimitReached]);


    const processUserMessage = useCallback(async (text: string) => {
        if (!text.trim()) {
            return;
        }

        if (isUsageLimitReached === true) {
            console.warn('[JarvisInterface] Usage limit reached. Message blocked.');
            return;
        }

        if (isAuthenticated === false) {
            incrementMessageCount();
        }

        setAiState('thinking');
        setSystemStatus(s => ({ ...s, cognitiveLoad: Math.min(100, s.cognitiveLoad + 30) }));
        const userMessage: Message = {
            id: `${Date.now()}-${Math.random()}`,
            text,
            sender: 'user',
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);

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
            console.error("[JarvisInterface] Error getting response from Gemini service:", error);
            handleNewMessage("I seem to be encountering a temporary communication error. Please try again shortly.", 'JARVIS');
            setAiState('idle');
        }

    }, [isAuthenticated, isUsageLimitReached, incrementMessageCount, handleNewMessage]);


    // --- Lifecycle and Initialization ---

    const initializeChat = useCallback(() => {
        if (hasInitializedChat.current === true || INITIAL_MESSAGES.length === 0) {
            return;
        }
        hasInitializedChat.current = true;
        const initialMessage = INITIAL_MESSAGES[0];
        setMessages([initialMessage]);
        setAiState('speaking');
        speak(initialMessage.text, () => setAiState('idle'));
    }, [speak]);

    useEffect(() => {
        jarvisService.initialize(import.meta.env.VITE_GEMINI_API_KEY || '');
    }, []);

    useEffect(() => {
        if (ttsIsReady === true) {
            initializeChat();
        }
    }, [ttsIsReady, initializeChat]);


    // --- UI Event Handlers ---

    const handleStabilityPatch = () => {
        setSystemStatus(s => ({ ...s, systemStability: 100 }));
        setUnlockedUpgrades(u => ({ ...u, stabilityPatch: false }));
        handleNewMessage("Re-calibration complete. System stability restored to 100%.");
    };


    // --- Render Logic ---
    // CORRECTED: Calculate the `isReady` state for the InputBar.
    // The input is "ready" only if all these conditions are met.
    const isInputReady =
        aiState === 'idle' &&
        isListening === false &&
        isUsageLimitReached === false;

    return (
        <>
            <Canvas camera={{ position: [0, 0, 15], fov: 75 }} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
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
            <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center z-10">
                <InputBar
                    onSendMessage={processUserMessage}
                    onVoiceStart={startListening}
                    // CORRECTED: Pass the `isReady` prop that InputBar expects.
                    isReady={isInputReady}
                />
            </div>
        </>
    );
};