// react-app/src/components/JarvisInterface.tsx - Upgraded for Metered Freemium Access

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useAuth } from '../context/AuthContext'; // No change needed here
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
    // --- New AuthContext Integration ---
    // Deconstruct the new values from our upgraded AuthContext.
    const { isAuthenticated, isUsageLimitReached, incrementMessageCount } = useAuth();
    
    // --- Existing State (No changes needed) ---
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
    const { isListening, startListening } = useSpeechRecognition(/*...*/); // Shortened for brevity

    // --- Core Logic Modifications ---

    const handleNewMessage = useCallback(/*...*/); // Existing logic is fine, shortened for brevity

    // UPGRADED: This function now acts as the gatekeeper for the freemium model.
    const processUserMessage = useCallback(async (text: string) => {
        // STEP 1: Check if the usage limit has been reached BEFORE processing.
        if (isUsageLimitReached) {
            handleNewMessage(
                "You have reached your free message limit. Please subscribe from the options below to continue the conversation.",
                'JARVIS'
            );
            setAiState('idle');
            return; // Halt execution immediately.
        }

        if (!text.trim()) { return; }

        // STEP 2: For guests, increment their message count. This is the metering action.
        incrementMessageCount();

        // STEP 3: The rest of the logic proceeds as normal.
        setAiState('thinking');
        const userMessage: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMessage]);
        
        try {
            const jarvisResponse = await jarvisService.generateResponse(text);
            // ... (rest of your existing logic for handling the response) ...
            handleNewMessage(jarvisResponse);
        } catch (error) {
            console.error("Error getting response from JARVIS service:", error);
            handleNewMessage("I seem to be encountering a temporary communication error. Please try again shortly.", 'JARVIS');
        }

    }, [isUsageLimitReached, incrementMessageCount, handleNewMessage]); // Added new dependencies

    const initializeChat = useCallback(() => {
        if (hasInitializedChat.current) {
            return;
        hasI}nitializedChat.current = true; // Mark as initialized immediately
        
        const initialMessage = INITIAL_MESSAGES[0];
        setMessages([initialMessage]);
        setAiState('speaking');
        speak(initialMessage.text, () => setAiState('idle'));
    }, [speak]); // Simplified dependencies

    const handleStabilityPatch = () => { /* ... existing logic ... */ };

    // --- Lifecycle Hook Upgrades ---

    // UPGRADED: Initialize services for ALL users on component mount.
    useEffect(() => {
        // SECURITY NOTE: Exposing an API key on the client-side is inherently risky.
        // The ideal architecture is a "Backend-for-Frontend" (BFF) where your server
        // makes calls to the Gemini API, protecting the key.
        jarvisService.initialize(import.meta.env.VITE_GEMINI_API_KEY || '');
    }, []); // Empty dependency array ensures this runs only ONCE.

    // UPGRADED: Initialize the chat for ALL users as soon as TTS is ready.
    useEffect(() => {
        if (ttsIsReady) {
            initializeChat();
        }
    }, [ttsIsReady, initializeChat]); // Runs when TTS becomes ready.

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
                {/* UPGRADED: The InputBar is now controlled by the usage limit. */}
                <InputBar
                    onSendMessage={processUserMessage}
                    onVoiceStart={startListening}
                    isReady={aiState === 'idle' && !isListening}
                    // Pass the usage limit status directly to the InputBar.
                    // This will be used to disable the input field and show a message.
                    isDisabled={isUsageLimitReached}
                />
            </div>
        </>
    );
};