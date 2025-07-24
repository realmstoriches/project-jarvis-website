import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthScreen } from './AuthScreen';

// This component checks for authentication.
// If the user is logged in, it shows the 'children' (the protected content).
// If not, it shows the AuthScreen.
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <AuthScreen />;
    }

    return <>{children}</>;
};