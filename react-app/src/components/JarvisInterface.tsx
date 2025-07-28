// react-app/src/components/JarvisInterface.tsx - The Definitive, Unabridged Version

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

export const JarvisInterface: React.FC = () => {
    // --- UPGRADE: Integrating with the new Freemium AuthContext ---
    const { isAuthenticated, isUsageLimitReached, incrementMessageCount } = useAuth();
    
    // --- Existing State (Unchanged) ---
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

    // --- Hooks and Callbacks (Complete and Unabridged) ---

    const { isListening, startListening } = useSpeechRecognition(() => setAiState('listening'), (transcript) => {
        setAiState('idle');
        if (transcript) {
            processUserMessage(transcript);
        }
    });

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

    // --- UPGRADE: The Gatekeeper for the Freemium Model ---
    const processUserMessage = useCallback(async (text: string) => {
        if (!text.trim()) { return; }
        
        // STEP 1: Enforce the usage limit. This is the new paywall.
        if (isUsageLimitReached) {
            handleNewMessage(
                "You have reached your free message limit. To continue the conversation, please choose a plan from the options below.",
                'JARVIS'
            );
            setAiState('idle');
            return; // Execution stops here.
        }

        // STEP 2: Meter guest usage. Increment their count with every valid message.
        if (!isAuthenticated) {
            incrementMessageCount();
        }

        // STEP 3: Proceed with standard message processing.
        setAiState('thinking');
        setSystemStatus(s => ({ ...s, cognitiveLoad: Math.min(100, s.cognitiveLoad + 30) }));
        const userMessage: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMessage]);
        
        try {
            const jarvisResponse = await jarvisService.generateResponse(text);
            setSystemStatus(s => ({ ...s, apiUsage: s.apiUsage + 1, cognitiveLoad: Math.max(0, s.cognitiveLoad - 30) }));
            
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
            console.error("Error getting response from JARVIS service:", error);
            handleNewMessage("I seem to be encountering a temporary communication error. Please try again shortly.", 'JARVIS');
            setAiState('idle'); // Ensure UI doesn't get stuck in a thinking state.
        }

    }, [isAuthenticated, isUsageLimitReached, incrementMessageCount, handleNewMessage]);

    // --- UPGRADE: Initialize Chat for ALL users ---
    const initializeChat = useCallback(() => {
        if (hasInitializedChat.current) return;
        hasInitializedChat.current = true;
        
        const initialMessage = INITIAL_MESSAGES[0];
        setMessages([initialMessage]);
        setAiState('speaking');
        speak(initialMessage.text, () => setAiState('idle'));
    }, [speak]); // Dependency is only on `speak` function.

    const handleStabilityPatch = () => {
        setSystemStatus(s => ({ ...s, systemStability: 100 }));
        setUnlockedUpgrades(u => ({ ...u, stabilityPatch: false }));
        handleNewMessage("Re-calibration complete. System stability restored to 100%.");
    };

    // --- UPGRADE: Universal Lifecycle Hooks ---
    
    // Initialize services for ALL users on first component mount.
    useEffect(() => {
        jarvisService.initialize(import.meta.env.VITE_GEMINI_API_KEY || '');
    }, []); // Empty dependency array ensures this runs exactly once.

    // Initialize the chat interface for ALL users as soon as Text-to-Speech is ready.
    useEffect(() => {
        if (ttsIsReady) {
            initializeChat();
        }
    }, [ttsIsReady, initializeChat]);

    // --- Render Logic ---
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
                    // --- UPGRADE: Input readiness is now simpler and controlled by the freemium limit ---
                    isReady={aiState === 'idle' && !isListening}
                    isDisabled={isUsageLimitReached}
                />
            </div>
        </>
    );
};