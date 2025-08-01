// react-app/src/context/AuthContext.tsx - FINAL, PRODUCTION-READY (IFRAME-AWARE)

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
// The shape of the data and functions the context will provide.
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean; // Will be true until the parent window sends the initial auth status.
    isUsageLimitReached: boolean;
    login: (userData: User) => void;
    logout: () => void;
}

// --- Context Creation ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- STATE MANAGEMENT ---
    // The user object, if the user is authenticated.
    const [user, setUser] = useState<User | null>(null);
    // Is the user authenticated? Controlled by the parent window.
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    // Has the guest usage limit been reached? Controlled by the parent window.
    const [isUsageLimitReached, setIsUsageLimitReached] = useState<boolean>(false);
    // Start in a loading state. We will exit this state once we receive the
    // first message from the parent window.
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // --- IFRAME COMMUNICATION LISTENER ---
    // This is the core logic for the iframe architecture.
    useEffect(() => {
        /**
         * Handles incoming messages from the parent window.
         * @param {MessageEvent} event - The message event from the parent.
         */
        const handleParentMessage = (event: MessageEvent) => {
            // CRITICAL SECURITY CHECK: Only accept messages from your own domain.
            // In production, you might want to hardcode this to 'https://your-main-site.com'.
            if (event.origin !== window.origin) {
                console.warn(`[AuthContext] Ignored message from unexpected origin: ${event.origin}`);
                return;
            }

            // Check for the specific message type we expect from our main script.
            if (event.data && event.data.type === 'AUTH_STATUS_FROM_PARENT') {
                console.log('[AuthContext] Received authentication status from parent window.', event.data);
                
                // Update the iframe's auth state based on the parent's message.
                setIsAuthenticated(event.data.isAuthenticated);
                setIsUsageLimitReached(event.data.isUsageLimitReached);
                
                // If the user is authenticated, you could potentially receive user data here.
                // For now, we'll just set a placeholder or null.
                if (event.data.isAuthenticated) {
                    // If the parent sends user data: setUser(event.data.user);
                } else {
                    setUser(null);
                }

                // We have received the authoritative state, so we are no longer loading.
                setIsLoading(false);
            }
        };

        // Attach the event listener.
        window.addEventListener('message', handleParentMessage);

        // CRITICAL CLEANUP: Remove the listener when the provider unmounts to prevent memory leaks.
        return () => {
            window.removeEventListener('message', handleParentMessage);
        };
    }, []); // The empty dependency array ensures this effect runs only ONCE.

    // --- LOCAL STATE FUNCTIONS ---
    // These functions allow the UI within the iframe to react to login/logout events
    // that happen inside the iframe itself.

    const login = (userData: User) => {
        // This function would be called after a successful login API call
        // from a form within this React app.
        setUser(userData);
        setIsAuthenticated(true);
        // The user is no longer a guest, so the usage limit is irrelevant.
        setIsUsageLimitReached(false);
    };

    const logout = async () => {
        // This function would be called after a logout button is clicked.
        // It's still good practice to attempt the API call.
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (error) {
            console.error('[AuthContext] Error during logout API call:', error);
        } finally {
            // Reset the state locally regardless of API success.
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    // Memoize the context value to prevent unnecessary re-renders of consuming components.
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
/**
 * A custom hook for consuming the AuthContext.
 * Ensures the hook is used within a component wrapped by AuthProvider.
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};