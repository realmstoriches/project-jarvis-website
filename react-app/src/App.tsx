// react-app/src/App.tsx - DEFINITIVELY CORRECTED

import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { JarvisInterface } from './components/JarvisInterface';
import { AuthScreen } from './components/AuthScreen';
import { PaymentStatus } from './components/PaymentStatus';

// NOTE: The `AuthProvider` has been moved to index.tsx. This file no longer
// contains it, which is the correct pattern.

// The Paywall/Subscription Modal
const UsageLimitModal: React.FC = () => {
    const navigate = useNavigate();
    const handleLoginClick = () => {
        navigate('/login');
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl mx-4 p-8 bg-gray-900/80 border border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-500/20 text-center">
                <h2 className="text-3xl font-mono font-bold text-cyan-300 mb-4">Usage Limit Reached</h2>
                <p className="text-gray-300 text-lg mb-8">Please log in or create an account to continue the conversation and unlock unlimited access.</p>
                <button onClick={handleLoginClick} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors font-semibold text-white text-lg">
                    Login or Subscribe
                </button>
            </div>
        </div>
    );
};

// Application Entry Point
export default function App() {
    const { isLoading, isAuthenticated, isUsageLimitReached } = useAuth();

    if (isLoading) {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center">
                <p className="text-cyan-400 text-2xl font-mono animate-pulse">Initializing Protocol...</p>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-black relative">
            <Routes>
                <Route path="/" element={
                    <>
                        <JarvisInterface />
                        {isUsageLimitReached && <UsageLimitModal />}
                    </>
                } />
                <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthScreen />} />
                <Route path="/payment-status" element={<PaymentStatus />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}