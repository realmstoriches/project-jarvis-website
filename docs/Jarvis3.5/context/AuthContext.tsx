import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the shape of the user object and the context value
interface User {
    id: string;
    email: string;
    subscription: {
        tier: string;
        stripeCustomerId: string;
        subscriptionStatus: string;
    };
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (userData: User) => void;
    logout: () => Promise<void>;
}

// --- NEW ---
// This helper points to your backend URL. It will use the correct URL for
// development (localhost) or production (your Render URL) automatically.
const API_URL = process.env.REACT_APP_API_URL;

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // --- INTEGRATED CHANGE ---
                // We now use the full, absolute URL to contact the backend.
                // 'credentials: "include"' is CRITICAL for sending the session cookie across domains.
                const response = await fetch(`${API_URL}/api/auth/status`, {
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.isAuthenticated) {
                        setUser(data.user);
                        setIsAuthenticated(true);
                    }
                }
            } catch (error) {
                console.error('Error checking authentication status:', error);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuthStatus();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            // --- INTEGRATED CHANGE ---
            // The logout endpoint also needs the full URL and credentials.
            await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};