import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// This component now has only ONE responsibility:
// If the user is authenticated, it renders the content it's protecting (children).
// If not, it redirects the user to the /login route.
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        // Redirect to the login page. The App router will handle rendering the AuthScreen.
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};