// react-app/src/context/AuthContext.tsx - FINAL, PRODUCTION-READY

import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { User } from '../types';

/**
 * @file Establishes the authentication context for the entire application.
 * @description This provider manages user state, authentication status, and
 * the freemium usage tracking for guest users. It serves as the central
 * authority for all authorization-related logic on the client-side.
 */

// --- Constants ---
const GUEST_PROMPT_LIMIT = 25;
const USAGE_COUNT_STORAGE_KEY = 'jarvisGuestUsageCount';

// --- Context Shape ---
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    usageCount: number;
    isUsageLimitReached: boolean;
    incrementMessageCount: () => void;
    login: (userData: User) => void;
    logout: () => void;
    checkSession: () => Promise<void>;
}

// --- Context Creation ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [usageCount, setUsageCount] = useState<number>(() => {
        const storedCount = localStorage.getItem(USAGE_COUNT_STORAGE_KEY);
        // Ensure we parse a valid number, defaulting to 0.
        const count = parseInt(storedCount || '0', 10);
        return isNaN(count) ? 0 : count;
    });

    const checkSession = useCallback(async () => {
        if (!isLoading) {
            setIsLoading(true);
        }
        try {
            // The 'credentials: include' option is vital for sending the session cookie.
            const response = await fetch('/api/auth/session', {
                credentials: 'include',
            });

            if (response.ok) {
                const sessionData = await response.json();
                if (sessionData.user) {
                    setUser(sessionData.user);
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('[AuthContext] Error checking session:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    // Check session only on initial application load.
    useEffect(() => {
        checkSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist guest usage count to local storage whenever it changes.
    useEffect(() => {
        if (!user) { // Only store usage for guests.
            localStorage.setItem(USAGE_COUNT_STORAGE_KEY, usageCount.toString());
        }
    }, [usageCount, user]);

    const login = (userData: User) => {
        setUser(userData);
        // Once a user logs in, their free prompt usage is irrelevant.
        // We clear the guest counter from storage and reset the state.
        localStorage.removeItem(USAGE_COUNT_STORAGE_KEY);
        setUsageCount(0);
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('[AuthContext] Error during logout API call:', error);
        } finally {
            setUser(null);
            setUsageCount(0); // Reset usage count for the next guest session.
        }
    };

    const incrementMessageCount = () => {
        // This function is guarded to only increment for guest users.
        if (!user) {
            setUsageCount((prevCount) => prevCount + 1);
        }
    };

    // --- Derived State (Best Practice) ---
    // Authentication status is derived directly from the user object.
    const isAuthenticated = !!user;
    // Usage limit is reached only if the user is a GUEST and exceeds the limit.
    const isUsageLimitReached = !isAuthenticated && usageCount >= GUEST_PROMPT_LIMIT;

    // Memoize the context value to prevent unnecessary re-renders of consumers.
    const value = useMemo(() => ({
        user,
        isAuthenticated,
        isLoading,
        usageCount,
        isUsageLimitReached,
        incrementMessageCount,
        login,
        logout,
        checkSession,
    }), [user, isAuthenticated, isLoading, usageCount, isUsageLimitReached, checkSession]);

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