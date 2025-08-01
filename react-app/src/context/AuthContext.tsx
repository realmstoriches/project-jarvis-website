// react-app/src/context/AuthContext.tsx - FINAL, WITH HANDSHAKE PROTOCOL

import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isUsageLimitReached: boolean;
    login: (userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isUsageLimitReached, setIsUsageLimitReached] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // --- NEW: Immediately tell the parent window that this app is ready to receive data.
        console.log('[IFRAME] AuthProvider mounted. Sending ready signal to parent.');
        window.parent.postMessage({ type: 'IFRAME_APP_READY' }, window.origin);

        const handleParentMessage = (event: MessageEvent) => {
            // Security check remains the same
            if (event.origin !== window.origin) {
                return;
            }

            if (event.data && event.data.type === 'AUTH_STATUS_FROM_PARENT') {
                console.log('[IFRAME] Received auth status from parent window.', event.data);
                
                setIsAuthenticated(event.data.isAuthenticated);
                setIsUsageLimitReached(event.data.isUsageLimitReached);
                
                if (event.data.isAuthenticated) {
                    // setUser(event.data.user);
                } else {
                    setUser(null);
                }

                // This will now be called reliably after the handshake is complete.
                setIsLoading(false);
            }
        };

        window.addEventListener('message', handleParentMessage);

        return () => {
            window.removeEventListener('message', handleParentMessage);
        };
    }, []); // This effect still only runs once on mount.

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

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};