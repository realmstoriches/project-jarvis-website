
import React from 'react';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-gray-900/80 border border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/20">
        <div className="flex justify-between items-center p-4 border-b border-cyan-500/30">
          <h3 className="text-lg font-mono text-cyan-300">{title}</h3>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};