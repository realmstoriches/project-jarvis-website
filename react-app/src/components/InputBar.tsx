// react-app/src/components/InputBar.tsx - FINAL, PRODUCTION-READY

import React, { useState, useEffect } from 'react';
import { SendIcon, MicIcon } from './Icons';
import { useAuth } from '../context/AuthContext';

/**
 * @file Renders the main user input bar for text and voice commands.
 * @description This component is responsible for capturing user input. It is
 * dynamically enabled or disabled based on the AI's state and the user's
 * authorization status, providing clear visual feedback.
 */

interface InputBarProps {
  onSendMessage: (message: string) => void;
  onVoiceStart: () => void;
  isReady: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({ onSendMessage, onVoiceStart, isReady }) => {
  const [inputValue, setInputValue] = useState('');
  const { isUsageLimitReached } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The button's disabled state already prevents this, but it's good practice
    // to have a final check.
    if (inputValue.trim() && isReady) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleMicClick = () => {
    // This handler will only fire if the button is not disabled.
    if (isReady) {
        onVoiceStart();
    }
  };

  // Determine the placeholder text based on the application's state.
  const getPlaceholderText = () => {
    if (isUsageLimitReached) {
      return 'Usage limit reached. Please subscribe to continue.';
    }
    if (!isReady) {
      return 'J.A.R.V.I.S. is processing...';
    }
    return 'Enter a prompt for J.A.R.V.I.S...';
  };

  // Clear the input if the component becomes disabled while the user is typing.
  useEffect(() => {
    if (!isReady) {
      setInputValue('');
    }
  }, [isReady]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={getPlaceholderText()}
          disabled={!isReady}
          className="w-full pl-12 pr-14 py-4 bg-gray-900/60 border border-cyan-500/50 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm transition-all disabled:bg-gray-800/80 disabled:cursor-not-allowed disabled:placeholder-gray-600"
          aria-label="Chat input"
        />
        <button
          type="button"
          onClick={handleMicClick}
          disabled={!isReady}
          className="absolute left-4 text-gray-400 hover:text-white disabled:text-gray-600/80 disabled:cursor-not-allowed transition-colors"
          aria-label="Start voice input"
        >
          <MicIcon />
        </button>
        <button
          type="submit"
          // Also disable the send button if there is no text.
          disabled={!isReady || !inputValue.trim()}
          className="absolute right-4 text-gray-400 hover:text-white disabled:text-gray-600/80 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};