import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { JarvisInterface } from './components/JarvisInterface';
import { PaymentStatus } from './components/PaymentStatus';
import { AuthScreen } from './components/AuthScreen';

const LoadingScreen = () => (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
        <p className="text-cyan-400 text-2xl font-mono animate-pulse">Initializing Protocol...</p>
    </div>
);

export default function App() {
    const { isLoading } = useAuth();

    // Show a loading screen while the authentication status is being checked on initial load.
    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Routes>
            {/* 
              The AuthScreen is now the designated "login" page. The ProtectedRoute component
              will handle showing this screen if a user is not authenticated.
            */}
            <Route path="/login" element={<AuthScreen />} />

            {/* 
              These are the main application routes. The <ProtectedRoute> wrapper will
              check for an active session. If the user is not authenticated, it will render
              the <AuthScreen> instead of the protected content.
            */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <JarvisInterface />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <JarvisInterface />
                    </ProtectedRoute>
                }
            />

            {/* 
              These routes handle the redirects from Stripe after a payment attempt.
              They are also protected to ensure they are only accessed within an authenticated session.
            */}
            <Route
                path="/payment-success"
                element={
                    <ProtectedRoute>
                        <PaymentStatus />
                    </ProtectedRoute>
                }
            />
             <Route
                path="/payment-cancel"
                element={
                    <ProtectedRoute>
                        <PaymentStatus />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}