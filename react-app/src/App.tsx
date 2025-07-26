// react-app/src/App.tsx - FINAL BULLETPROOF VERSION

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import both
import { ProtectedRoute } from './components/ProtectedRoute';
import { JarvisInterface } from './components/JarvisInterface';
import { PaymentStatus } from './components/PaymentStatus';
import { AuthScreen } from './components/AuthScreen';

// Create a new component that contains your routes.
// This component will be rendered INSIDE the AuthProvider.
const AppRoutes = () => {
    // Now it is safe to call useAuth here, because AppRoutes is a child of AuthProvider.
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center">
                <p className="text-cyan-400 text-2xl font-mono animate-pulse">Initializing Protocol...</p>
            </div>
        );
    }

    return (
        <Routes>
            <Route 
                path="/login" 
                element={!isAuthenticated ? <AuthScreen /> : <Navigate to="/dashboard" replace />} 
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <JarvisInterface />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/payment-status"
                element={
                    <ProtectedRoute>
                        <PaymentStatus />
                    </ProtectedRoute>
                }
            />
            {/* The root path now correctly redirects based on auth status */}
            <Route 
                path="/" 
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

// The main App component now has only ONE job: set up the providers.
export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}