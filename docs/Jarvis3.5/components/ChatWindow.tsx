
import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="w-full h-full bg-black/40 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10 backdrop-blur-md flex flex-col">
      <div className="p-4 border-b border-cyan-500/30 text-center">
        <h2 className="text-lg font-mono text-cyan-300">COMMS CHANNEL</h2>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-cyan-800/70 text-white'
                    : 'bg-gray-700/70 text-gray-200'
                }`}
              >
                <p className="text-sm break-words">{msg.text}</p>
                 <p className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};