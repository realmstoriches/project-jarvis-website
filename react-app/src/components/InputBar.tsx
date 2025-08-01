// --- react-app/src/components/InputBar.tsx ---

import React, { useState, useEffect } from 'react';
import { SendIcon, MicIcon } from './Icons';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  onVoiceStart: () => void;
  isReady: boolean;
  isUsageLimitReached: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({ onSendMessage, onVoiceStart, isReady, isUsageLimitReached }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && isReady) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleMicClick = () => {
    if (isReady) {
        onVoiceStart();
    }
  };

  const getPlaceholderText = () => {
    if (isUsageLimitReached) {
      return 'Usage limit reached. Please subscribe to continue.';
    }
    if (!isReady) {
      return 'J.A.R.V.I.S. is processing...';
    }
    return 'Enter a prompt for J.A.R.V.I.S...';
  };

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
        <button type="button" onClick={handleMicClick} disabled={!isReady} className="absolute left-4 text-gray-400 hover:text-white disabled:text-gray-600/80 disabled:cursor-not-allowed transition-colors" aria-label="Start voice input">
          <MicIcon />
        </button>
        <button type="submit" disabled={!isReady || !inputValue.trim()} className="absolute right-4 text-gray-400 hover:text-white disabled:text-gray-600/80 disabled:cursor-not-allowed transition-colors" aria-label="Send message">
          <SendIcon />
        </button>
      </form>
    </div>
  );
};