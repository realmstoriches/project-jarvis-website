
import React, { useState } from 'react';
import { SendIcon, MicIcon } from './Icons';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  onVoiceStart: () => void;
  isReady: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({ onSendMessage, onVoiceStart, isReady }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && isReady) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleMicClick = () => {
      if(isReady) {
          onVoiceStart();
      }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a prompt for J.A.R.V.I.S..."
          disabled={!isReady}
          className="w-full pl-12 pr-12 py-3 bg-gray-900/50 border border-cyan-500/50 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm transition-all"
        />
        <button
          type="button"
          onClick={handleMicClick}
          disabled={!isReady}
          className="absolute left-3 text-gray-400 hover:text-white disabled:text-gray-600 transition-colors"
        >
          <MicIcon />
        </button>
        <button
          type="submit"
          disabled={!isReady || !inputValue.trim()}
          className="absolute right-3 text-gray-400 hover:text-white disabled:text-gray-600 transition-colors"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};