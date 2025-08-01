// react-app/src/components/common/Modal.tsx - FINAL, PRODUCTION-READY

import React, { useEffect } from 'react';

/**
 * @file A generic, reusable modal component for displaying content in a focused overlay.
 * @description This component provides the basic structure for a modal dialog,
 * including a backdrop, a content container, and accessibility features.
 * It is used by other components like the SubscriptionModal.
 */

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {

  // Add event listener to handle 'Escape' key press for closing the modal.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove the event listener when the modal is unmounted.
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    // The fixed container for the modal overlay.
    // Added accessibility roles for screen readers.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      // Optional: To close modal on backdrop click, uncomment the line below.
      // onClick={onClose}
    >
      {/* The main modal panel. `onClick` with `e.stopPropagation()` prevents a click
          inside the modal from bubbling up and closing it. */}
      <div
        className="w-full max-w-lg mx-auto bg-gray-900/80 border border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-cyan-500/30">
          <h3 id="modal-title" className="text-lg font-mono text-cyan-300">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            {/* A standard 'X' icon for closing */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        {/* The content of the modal is rendered here */}
        <div className="max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};