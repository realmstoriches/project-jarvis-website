// react-app/src/context/AuthContext.tsx - WITH DIAGNOSTIC LOGGING

import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode } from 'react';
import { User } from '../types';

/**
 * @file Establishes the authentication context for the entire application.
 * @description This provider is designed to run within an iframe. It does not manage
 * authentication state itself; instead, it listens for authentication status messages
 * sent from the parent window via `postMessage`. This makes the parent window the
 * single source of truth for all authorization-related logic.
 */

// --- Context Shape ---
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isUsageLimitReached: boolean;
    login: (userData: User) => void;
    logout: () => void;
}

// --- Context Creation ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isUsageLimitReached, setIsUsageLimitReached] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const handleParentMessage = (event: MessageEvent) => {
            // --- ADDED: DIAGNOSTIC LOG ---
            // This will log ANY message received by the iframe window.
            console.log('[IFRAME] Message received from parent. Full Event:', event);

            // CRITICAL SECURITY CHECK
            if (event.origin !== window.origin) {
                console.warn(`[AuthContext] Ignored message from unexpected origin: ${event.origin}`);
                return;
            }

            if (event.data && event.data.type === 'AUTH_STATUS_FROM_PARENT') {
                console.log('[AuthContext] Received authentication status from parent window.', event.data);
                
                setIsAuthenticated(event.data.isAuthenticated);
                setIsUsageLimitReached(event.data.isUsageLimitReached);
                
                if (event.data.isAuthenticated) {
                    // setUser(event.data.user);
                } else {
                    setUser(null);
                }

                setIsLoading(false);
            }
        };

        window.addEventListener('message', handleParentMessage);

        return () => {
            window.removeEventListener('message', handleParentMessage);
        };
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
        setIsUsageLimitReached(false);
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (error) {
            console.error('[AuthContext] Error during logout API call:', error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const value = useMemo(() => ({
        user,
        isAuthenticated,
        isLoading,
        isUsageLimitReached,
        login,
        logout,
    }), [user, isAuthenticated, isLoading, isUsageLimitReached]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Custom Hook ---
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};