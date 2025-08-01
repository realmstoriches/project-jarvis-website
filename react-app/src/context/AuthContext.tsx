// react-app/src/context/AuthContext.tsx - FINAL, PRODUCTION-READY & FULLY CORRECTED

import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isUsageLimitReached: boolean;
    login: (userData: User) => void;
    logout: () => void;
    checkSession: () => void; // Now returns void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isUsageLimitReached, setIsUsageLimitReached] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const checkSession = () => {
        console.log('[AuthContext] checkSession called. Forcing top-level redirect to re-sync state after payment.');
        if (window.top) {
            window.top.location.href = '/';
        } else {
            // Fallback to current window if top is not available
            window.location.href = '/';
        }
    };

    useEffect(() => {
        console.log('[IFRAME] AuthProvider mounted. Sending ready signal to parent.');
        window.parent.postMessage({ type: 'IFRAME_APP_READY' }, window.origin);

        const handleParentMessage = (event: MessageEvent) => {
            if (event.origin !== window.origin) {
                return;
            }
            if (event.data && event.data.type === 'AUTH_STATUS_FROM_PARENT') {
                console.log('[IFRAME] Received auth status from parent window.', event.data);
                setIsAuthenticated(event.data.isAuthenticated);
                setIsUsageLimitReached(event.data.isUsageLimitReached);
                
                // This logic correctly handles setting a placeholder user object on auth confirmation.
                if (event.data.isAuthenticated) {
                    setUser(prevUser => prevUser || ({} as User));
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

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        // We don't need to call the API here, a page reload initiated by logging out would suffice.
    };

    const value = useMemo(() => ({
        user, isAuthenticated, isLoading, isUsageLimitReached, login, logout, checkSession,
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