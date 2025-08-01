// react-app/src/App.tsx - FINAL, PRODUCTION-READY

import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { JarvisInterface } from './components/JarvisInterface';
import { AuthScreen } from './components/AuthScreen';
import { PaymentStatus } from './components/PaymentStatus';

/**
 * @file The root component for the application's UI.
 * @description This file orchestrates the main application layout and routing.
 * It uses the AuthContext to determine which view to display, seamlessly
 * handling the experience for guests, authenticated users, and users who
 * have hit the freemium usage limit.
 */

// --- Integrated Component: The Paywall/Subscription Modal ---
// This modal appears when a guest's usage limit is reached.
const UsageLimitModal: React.FC = () => {
    const navigate = useNavigate();

    const handleLoginClick = () => {
        // Redirect the user to the dedicated login/registration page.
        navigate('/login');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl mx-4 p-8 bg-gray-900/80 border border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-500/20 text-center">
                <h2 className="text-3xl font-mono font-bold text-cyan-300 mb-4">
                    Usage Limit Reached
                </h2>
                <p className="text-gray-300 text-lg mb-2">
                    You have used all your free prompts for this session.
                </p>
                <p className="text-gray-400 mb-8">
                    Please log in or create an account to continue the conversation and unlock unlimited access.
                </p>
                <div className="flex justify-center items-center">
                    {/* This single button directs users to the unified AuthScreen */}
                    <button
                        onClick={handleLoginClick}
                        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors font-semibold text-white text-lg"
                    >
                        Login or Subscribe
                    </button>
                </div>
                 <div className="mt-6">
                    <a href="https://realmstoriches.xyz#jarvis-3.5-section" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-cyan-400 transition-colors">
                        View Pricing Table on Main Site
                    </a>
                </div>
            </div>
        </div>
    );
};


// --- Core Application Layout and Routing Logic ---
const AppCore: React.FC = () => {
    const { isAuthenticated, isUsageLimitReached } = useAuth();

    return (
        <div className="w-screen h-screen bg-black relative">
            <Routes>
                {/* The Main JARVIS Interface Route */}
                <Route
                    path="/"
                    element={
                        <>
                            <JarvisInterface />
                            {/* The paywall modal is rendered on top only when the usage limit is hit */}
                            {isUsageLimitReached && <UsageLimitModal />}
                        </>
                    }
                />

                {/* The Authentication Route */}
                <Route
                    path="/login"
                    element={
                        // If user is already logged in, redirect them away from the login page.
                        isAuthenticated ? <Navigate to="/" replace /> : <AuthScreen />
                    }
                />

                {/* The Stripe Redirect Route */}
                <Route path="/payment-status" element={<PaymentStatus />} />

                {/* Catch-all route to redirect any unknown paths back to the home interface */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
};


// --- Application Entry Point ---
// This component handles the initial loading state before handing off to the router.
export default function App() {
    const { isLoading } = useAuth();

    // While the session is being verified, show a clean loading indicator.
    if (isLoading) {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center">
                <p className="text-cyan-400 text-2xl font-mono animate-pulse">
                    Initializing Protocol...
                </p>
            </div>
        );
    }

    // Once loading is complete, render the core application with its routes.
    return <AppCore />;
}